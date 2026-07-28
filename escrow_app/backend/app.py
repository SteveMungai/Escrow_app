import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Flask, jsonify, request, g
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
from flask_migrate import Migrate

from config import get_config
from models import db, User, Project, Milestone, Freelancer, Admin, Review, Transaction, Escrow, Client, Deliverable

app = Flask(__name__)
app.config.from_object(get_config())

CORS(app, origins=app.config["CORS_ORIGINS"])
db.init_app(app)
migrate = Migrate(app, db)

JWT_EXPIRY_HOURS = 24


def generate_token(user):
    payload = {
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")


def token_required(f):
    """Protects a route — requires a valid 'Authorization: Bearer <token>' header.
    On success, makes the decoded user available as g.current_user_id / g.current_user_role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401

        g.current_user_id = payload["user_id"]
        g.current_user_role = payload.get("role")
        return f(*args, **kwargs)
    return decorated


def require_fields(data, fields):
    """Returns a list of any required fields missing from the request body."""
    return [f for f in fields if f not in data or data[f] in (None, "")]


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


# ---------- Users ----------
@app.route("/api/users", methods=["GET"])
def list_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["name", "email", "password"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=generate_password_hash(data["password"]),
        role=data.get("role", "user"),
    )
    db.session.add(user)
    db.session.commit()
    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["email", "password"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password."}), 401

    token = generate_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 200


@app.route("/api/users/me/balance", methods=["GET"])
@token_required
def get_my_balance():
    """Returns the wallet balance for whoever the JWT belongs to —
    identified from the token itself, never trusted from a request param."""
    user = User.query.get_or_404(g.current_user_id)
    return jsonify({"balance": user.balance})


# ---------- Clients ----------
# A Client links a User to their client-side profile.  Project.client_id
# points at Client.client_id, not directly at User.user_id.
@app.route("/api/clients", methods=["GET"])
def list_clients():
    user_id = request.args.get("user_id", type=int)
    query = Client.query
    if user_id:
        query = query.filter_by(user_id=user_id)
    clients = query.all()
    return jsonify([c.to_dict() for c in clients])


@app.route("/api/clients", methods=["POST"])
@token_required
def create_client():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["user_id"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    client = Client(
        user_id=data["user_id"],
        company_name=data.get("company_name"),
        company_website=data.get("company_website"),
    )
    db.session.add(client)
    db.session.commit()
    return jsonify(client.to_dict()), 201


# ---------- Projects (escrow jobs) ----------
@app.route("/api/projects", methods=["GET"])
def list_projects():
    projects = Project.query.all()
    return jsonify([p.to_dict() for p in projects])


@app.route("/api/projects/<int:project_id>", methods=["GET"])
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    return jsonify(project.to_dict())


@app.route("/api/projects/<int:project_id>/full", methods=["GET"])
def get_project_full(project_id):
    """Everything the Escrow Detail page needs in one call: project, its
    escrow, its milestones, the assigned freelancer, and the client."""
    project = Project.query.get_or_404(project_id)
    escrow = (
        Escrow.query.filter_by(project_id=project_id)
        .order_by(Escrow.Escrow_id.desc())
        .first()
    )
    milestones = (
        Milestone.query.filter_by(project_id=project_id)
        .order_by(Milestone.milestone_id)
        .all()
    )
    freelancer = Freelancer.query.get(project.freelancer_id) if project.freelancer_id else None
    client = Client.query.get(project.client_id)

    return jsonify({
        "project": project.to_dict(),
        "escrow": escrow.to_dict() if escrow else None,
        "milestones": [m.to_dict() for m in milestones],
        "freelancer": freelancer.to_dict() if freelancer else None,
        "client": client.to_dict() if client else None,
    })


@app.route("/api/projects", methods=["POST"])
@token_required
def create_project():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["project_title", "description", "client_id"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    project = Project(
        project_title=data["project_title"],
        description=data["description"],
        client_id=data["client_id"],
        freelancer_id=data.get("freelancer_id"),
    )
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201


@app.route("/api/projects/<int:project_id>/fund", methods=["POST"])
@token_required
def fund_project(project_id):
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["amount"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    project = Project.query.get_or_404(project_id)
    project.status = "funded"

    escrow = Escrow(project_id=project.project_id, amount_held=data["amount"])
    db.session.add(escrow)
    db.session.commit()
    return jsonify({"project": project.to_dict(), "escrow": escrow.to_dict()}), 200


@app.route("/api/projects/<int:project_id>/complete", methods=["POST"])
@token_required
def complete_project(project_id):
    project = Project.query.get_or_404(project_id)
    project.status = "completed"
    db.session.commit()
    return jsonify(project.to_dict())

#-----Delete route for escrows page-----
@app.route("/api/projects/<int:project_id>", methods=["DELETE"])
@token_required
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    cascade = request.args.get("cascade", "false").lower() == "true"

    milestone_ids = [m.milestone_id for m in Milestone.query.filter_by(project_id=project_id).all()]
    escrow_ids = [e.Escrow_id for e in Escrow.query.filter_by(project_id=project_id).all()]

    counts = {
        "milestones": len(milestone_ids),
        "escrows": len(escrow_ids),
        "reviews": Review.query.filter_by(project_id=project_id).count(),
        "transactions": (
            Transaction.query.filter(Transaction.Escrow_id.in_(escrow_ids)).count()
            if escrow_ids else 0
        ),
        "deliverables": (
            Deliverable.query.filter(Deliverable.milestone_id.in_(milestone_ids)).count()
            if milestone_ids else 0
        ),
    }
    has_linked = any(counts.values())

    if has_linked and not cascade:
        return jsonify({
            "error": "This project has linked records that will also be deleted.",
            "counts": counts
        }), 409

    try:
        if cascade:
            if milestone_ids:
                Deliverable.query.filter(
                    Deliverable.milestone_id.in_(milestone_ids)
                ).delete(synchronize_session=False)
            if escrow_ids:
                Transaction.query.filter(
                    Transaction.Escrow_id.in_(escrow_ids)
                ).delete(synchronize_session=False)
            Review.query.filter_by(project_id=project_id).delete(synchronize_session=False)
            Escrow.query.filter_by(project_id=project_id).delete(synchronize_session=False)
            Milestone.query.filter_by(project_id=project_id).delete(synchronize_session=False)

        db.session.delete(project)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Something went wrong deleting this project."}), 409

    return jsonify({"message": "Project deleted"}), 200

# ---------- Freelancers ----------
@app.route("/api/freelancers", methods=["GET"])
def list_freelancers():
    name = request.args.get("name")
    query = Freelancer.query
    if name:
        query = query.filter(Freelancer.freelancer_name.ilike(f"%{name}%"))
    freelancers = query.all()
    return jsonify([f.to_dict() for f in freelancers])


@app.route("/api/freelancers", methods=["POST"])
@token_required
def create_freelancer():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["freelancer_name", "user_id"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    freelancer = Freelancer(
        freelancer_name=data["freelancer_name"],
        user_id=data["user_id"],
        skills=data.get("skills", []),
        rating=data.get("rating", 0.0),
        portfolio_url=data.get("portfolio_url"),
    )
    db.session.add(freelancer)
    db.session.commit()
    return jsonify(freelancer.to_dict()), 201


# ---------- Reviews ----------
@app.route("/api/reviews", methods=["GET"])
def list_reviews():
    reviews = Review.query.all()
    return jsonify([r.to_dict() for r in reviews])


@app.route("/api/reviews", methods=["POST"])
@token_required
def create_review():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["reviewer_id", "reviewee_id", "project_id", "rating"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    review = Review(
        Reviewer_id=data["reviewer_id"],
        Reviewee_id=data["reviewee_id"],
        project_id=data["project_id"],
        rating=data["rating"],
        comment=data.get("comment", ""),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify(review.to_dict()), 201


# ---------- Escrows ----------
@app.route("/api/escrows", methods=["GET"])
def list_escrows():
    escrows = Escrow.query.all()
    return jsonify([e.to_dict() for e in escrows])


@app.route("/api/escrows/<int:escrow_id>", methods=["GET"])
def get_escrow(escrow_id):
    escrow = Escrow.query.get_or_404(escrow_id)
    return jsonify(escrow.to_dict())


@app.route("/api/escrows/<int:escrow_id>/release", methods=["POST"])
@token_required
def release_escrow(escrow_id):
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["amount"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    escrow = Escrow.query.get_or_404(escrow_id)
    escrow.released_amount += data["amount"]
    if escrow.released_amount >= escrow.amount_held:
        escrow.status = "completed"


    milestone = None
    milestone_id = data.get("milestone_id")
    if milestone_id:
        milestone = Milestone.query.get(milestone_id)
        if milestone:
            milestone.status = "released"

    project = Project.query.get(escrow.project_id)
    if project and escrow.released_amount >= escrow.amount_held:
        project.status = "completed"

    transaction = Transaction(
        Transaction_type="milestone_release",
        Escrow_id=escrow.Escrow_id,
        amount=data["amount"],
        status="completed",
    )
    db.session.add(transaction)
    db.session.commit()
    return jsonify({
        "escrow": escrow.to_dict(),
        "transaction": transaction.to_dict(),
        "milestone": milestone.to_dict() if milestone else None,
        "project": project.to_dict() if project else None,
    }), 200


# ---------- Transactions ----------
@app.route("/api/transactions", methods=["GET"])
def list_transactions():
    transactions = Transaction.query.all()
    return jsonify([t.to_dict() for t in transactions])


# ---------- Milestones ----------
@app.route("/api/milestones", methods=["GET"])
def list_milestones():
    project_id = request.args.get("project_id", type=int)
    query = Milestone.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    milestones = query.all()
    return jsonify([m.to_dict() for m in milestones])


@app.route("/api/milestones", methods=["POST"])
@token_required
def create_milestone():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["project_id", "title", "description"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

 
    deadline = None
    if data.get("deadline"):
        try:
            deadline = datetime.strptime(data["deadline"], "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "deadline must be in YYYY-MM-DD format"}), 400

    milestone = Milestone(
        project_id=data["project_id"],
        title=data["title"],
        description=data["description"],
        amount=data.get("amount", 0),
        deadline=deadline,
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify(milestone.to_dict()), 201


@app.route("/api/milestones/<int:milestone_id>/status", methods=["POST"])
@token_required
def update_milestone_status(milestone_id):
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["status"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    milestone = Milestone.query.get_or_404(milestone_id)
    milestone.status = data["status"]
    db.session.commit()
    return jsonify(milestone.to_dict())


# ---------- Deliverables ----------
@app.route("/api/deliverables", methods=["GET"])
def list_deliverables():
    milestone_id = request.args.get("milestone_id", type=int)
    query = Deliverable.query
    if milestone_id:
        query = query.filter_by(milestone_id=milestone_id)
    deliverables = query.all()
    return jsonify([d.to_dict() for d in deliverables])


@app.route("/api/deliverables", methods=["POST"])
@token_required
def create_deliverable():
    
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["milestone_id", "freelancer_id", "file_path"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    deliverable = Deliverable(
        milestone_id=data["milestone_id"],
        freelancer_id=data["freelancer_id"],
        file_path=data["file_path"],
    )
    db.session.add(deliverable)
    db.session.commit()
    return jsonify(deliverable.to_dict()), 201


# ---------- Wallet ----------
@app.route("/api/wallet/topup", methods=["POST"])
@token_required
def topup_wallet():
    try:
        data = request.get_json(silent=True) or {}

        missing = require_fields(data, ["user_id", "amount"])
        if missing:
            return jsonify({
                "success": False,
                "message": f"Missing fields: {', '.join(missing)}"
            }), 400

        user_id = data.get("user_id")


        if user_id != g.current_user_id:
            return jsonify({
                "success": False,
                "message": "You can only top up your own wallet."
            }), 403

        amount = float(data.get("amount", 0))

        if amount <= 0:
            return jsonify({
                "success": False,
                "message": "Amount must be greater than zero"
            }), 400

        user = User.query.get(user_id)

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        if user.balance is None:
            user.balance = 0

        user.balance += amount
        transaction = Transaction(
            user_id=user.user_id,
            amount=amount,
            status="completed",
            transaction_date=datetime.utcnow(),
            Transaction_type="topup"
        )

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Wallet funded successfully",
            "new_balance": user.balance
        }), 200

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route("/api/wallet/<int:user_id>", methods=["GET"])
@token_required
def get_wallet(user_id):
  
    if user_id != g.current_user_id:
        return jsonify({
            "success": False,
            "message": "You can only view your own wallet."
        }), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    return jsonify({
        "success": True,
        "balance": user.balance
    })


@app.route("/api/wallet/history/<int:user_id>", methods=["GET"])
@token_required
def wallet_history(user_id):
    
    if user_id != g.current_user_id:
        return jsonify({
            "success": False,
            "message": "You can only view your own transaction history."
        }), 403

    transactions = Transaction.query.filter_by(
        user_id=user_id
    ).order_by(Transaction.transaction_date.desc()).all()

    return jsonify([
        {
            "id": t.transaction_id,
            "amount": t.amount,
            "type": t.Transaction_type,
            "status": t.status,
            "created_at": t.transaction_date.isoformat()
        }
        for t in transactions
    ])


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy

from config import Config
from models import db, User, Project, Milestone, Freelancer, Review, Transaction,Escrow
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')


CORS(app)  # allows the Vite dev server (localhost:5173) to call this API
db.init_app(app)

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
        password_hash=bcrypt.generate_password_hash(data["password"]),
        role=data.get("role", "user"),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


# ---------- Projects (escrows) ----------
@app.route("/api/projects", methods=["GET"])
def list_projects():
    projects = Project.query.all()
    return jsonify([p.to_dict() for p in projects])


@app.route("/api/projects", methods=["POST"])
def create_project():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["project_title","description" ,"client_id"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    
    project = Project(
        title=data["project_title"],
        description=data["description"],
        client_id=data["client_id"],
        escrow_amount=data.get("escrow_amount", 0),
    )
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201


@app.route("/api/projects/<int:project_id>/fund", methods=["POST"])
def fund_project(project_id):
    data=request.get_json(silent=True) or {}
    missing=require_fields(data,["escrow_amount"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    
    project = Project.query.get_or_404(project_id)
    project.status = "funded"

    escrow=Escrow(
        project_id=project.project_id,
        amount_held=data["escrow_amount"],
        status="funded"
    )

    db.session.add(escrow)
    db.session.commit()
    return jsonify({"project": project.to_dict(), "escrow": escrow.to_dict()}), 200


@app.route("/api/projects/<int:project_id>/complete", methods=["POST"])
def complete_project(project_id):
    project = Project.query.get_or_404(project_id)
    project.status = "completed"
    db.session.commit()
    return jsonify({"project": project.to_dict()})

#Freelancer routes
@app.route("/api/freelancers", methods=["GET"])
def list_freelancers():
    freelancers = Freelancer.query.all()
    return jsonify([f.to_dict() for f in freelancers])

@app.route("/api/freelancers", methods=["POST"])
def create_freelancer():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["user_id","freelancer_name","profile_url","rating","freelancer_id", "skills"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    
    
    freelancer = Freelancer(
        user_id=data["user_id"],
        freelancer_name=data["freelancer_name"],
        freelancer_id=data.get("freelancer_id"),
        skills=data["skills"],
        rating=data.get("rating", 0.0),
        profile_url=data.get("profile_url")
    )
    db.session.add(freelancer)
    db.session.commit()
    return jsonify(freelancer.to_dict()), 201

#Review routes
@app.route("/api/reviews", methods=["GET"])
def list_reviews():
    reviews = Review.query.all()
    return jsonify([r.to_dict() for r in reviews])

@app.route("/api/reviews", methods=["POST"])
def create_review():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["project_id", "Reviewer_id","Review_id","Reviewee_id","review_date" ,"project_date","rating", "comment"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    
    review = Reviews(
        project_id=data["project_id"],
        reviewer_id=data["reviewer_id"],
        reviewee_id=data["reviewee_id"],
        rating=data["rating"],
        review_date=data.get("review_date"),
        project_date=data.get("project_date"),
        comment=data.get("comment")
    )
    db.session.add(review)
    db.session.commit()
    return jsonify(review.to_dict()), 201

#Escrows
@app.route("/api/escrows", methods=["GET"])
def list_escrows(): 
    escrows=Escrow.query.all()
    return jsonify([e.to_dict() for e in escrows])

@app.route("/api/escrows/<int:escrow_id>/release", methods=["POST"])
def update_escrow(escrow_id):
    escrow = Escrow.query.get_or_404(escrow_id)
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["amount_held", "status"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    escrow.update_escrow +=data["amount_held"]
    if escrow.update_escrow >= escrow.amount_held:
        escrow.update_escrow = escrow.amount_held
        escrow.status = "released"
    
    transaction = Transaction(
        transaction_id=data.get("transaction_id"),
        Transaction_type=data.get("Transaction_type"),
        Escrow_id=escrow.Escrow_id,
        amount=data.get("amount", 0),
        status="completed",
        transaction_date=data.get("transaction_date")
    )

    db.session.add(transaction)
    db.session.commit()
    return jsonify(escrow.to_dict()), jsonify(transaction.to_dict()), 200

#Transaction routes
@app.route("/api/transactions", methods=["GET"])
def list_transactions():
    transactions = Transaction.query.all()
    return jsonify([t.to_dict() for t in transactions])

#Milestone routes
@app.route("/api/milestones", methods=["GET"])
def list_milestones():  
    milestones = Milestone.query.all()
    return jsonify([m.to_dict() for m in milestones])

@app.route("/api/milestones", methods=["POST"])
def create_milestone():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["project_id", "title", "description", "amount", "deadline"])
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    
    milestone = Milestone(
        milestone_id=data.get("milestone_id"),
        project_id=data["project_id"],
        title=data["title"],
        description=data["description"],
        amount=data.get("amount", 0),
        deadline=data.get("deadline"),
        status="pending"
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify(milestone.to_dict()), 201


if __name__ == "__main__":
    with app.app_context():
        db.create_all()  
    app.run(debug=True, port=5000)

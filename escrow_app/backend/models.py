from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    user_id=db.Column(db.Integer, primary_key=True)
    name=db.Column(db.String(120),nullable=False)
    email=db.Column(db.String(120),unique=True,nullable=False)
    created_at=db.Column(db.DateTime, default=datetime.utcnow)
    rating=db.Column(db.Float)
    role=db.Column(db.String(50),default="user")
    password_hash=db.Column(db.String(128),nullable=False)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at,
            "rating": self.rating,
            "role": self.role
        }

class Project(db.Model):
    __tablename__="Projects"
    project_id=db.Column(db.Integer,primary_key=True)
    client_id=db.Column(db.Integer,db.ForeignKey("client.client_id"),nullable=False)
    project_title=db.Column(db.String(200),nullable=False)
    description=db.Column(db.String(500),nullable=False)
    status=db.Column(db.String(30),default="created") # created, funded, completed
    created_at=db.Column(db.DateTime, default=datetime.utcnow)
    freelancer_id=db.Column(db.Integer,db.ForeignKey("Freelancer.freelancer_id"),nullable=True)

    def to_dict(self):
        return {
            "project_id": self.project_id,
            "client_id": self.client_id,
            "project_title": self.project_title,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at,
            "freelancer_id": self.freelancer_id
        }

class Freelancer(db.Model):
    __tablename__="Freelancer"
    freelancer_id=db.Column(db.Integer,primary_key=True)
    freelancer_name=db.Column(db.String(120),nullable=False)
    user_id=db.Column(db.Integer,db.ForeignKey("users.user_id"),nullable=False)
    skills=db.Column(db.JSON,nullable=True)
    rating=db.Column(db.Float,default=0.0)
    portfolio_url=db.Column(db.String(200),nullable=True)

    def to_dict(self):
        return {
            "freelancer_id": self.freelancer_id,
            "freelancer_name": self.freelancer_name,
            "user_id": self.user_id,
            "skills": self.skills,
            "rating": self.rating,
            "portfolio_url": self.portfolio_url
        }

class Admin(db.Model):
    __tablename__="Admin"
    admin_id=db.Column(db.Integer,primary_key=True)
    user_id=db.Column(db.Integer,db.ForeignKey("users.user_id"),nullable=False)
    Permission_level=db.Column(db.JSON,nullable=True)

    def to_dict(self):
        return {
            "admin_id": self.admin_id,
            "user_id": self.user_id,
            "Permission_level": self.Permission_level
        }
    
class Review(db.Model):
    __tablename__="Reviews"
    Review_id=db.Column(db.Integer,primary_key=True)
    Reviewer_id=db.Column(db.Integer,db.ForeignKey("users.user_id"),nullable=False)
    Reviewee_id=db.Column(db.Integer,db.ForeignKey("Freelancer.freelancer_id"),nullable=False)
    project_id=db.Column(db.Integer,db.ForeignKey("Projects.project_id"),nullable=False)
    rating=db.Column(db.Float,default=0.0)
    review_date=db.Column(db.DateTime, default=datetime.utcnow)
    comment=db.Column(db.String(500),nullable=True)

    def to_dict(self):
        return {
            "Review_id": self.Review_id,
            "Reviewer_id": self.Reviewer_id,
            "Reviewee_id": self.Reviewee_id,
            "project_id": self.project_id,
            "rating": self.rating,
            "review_date": self.review_date,
            "comment": self.comment
        }

class Transaction(db.Model):
    __tablename__="Transaction"
    transaction_id=db.Column(db.Integer,primary_key=True)
    Transaction_type=db.Column(db.String(50),nullable=False) # deposit, withdrawal, milestone_release   
    Escrow_id=db.Column(db.Integer,db.ForeignKey("Escrow.Escrow_id"),nullable=False)
    amount=db.Column(db.Float,nullable=False)
    transaction_date=db.Column(db.DateTime, default=datetime.utcnow)
    status=db.Column(db.String(30),default="pending") # pending, completed, failed

    def to_dict(self):
        return {
            "transaction_id": self.transaction_id,
            "Transaction_type": self.Transaction_type,
            "Escrow_id": self.Escrow_id,
            "amount": self.amount,
            "transaction_date": self.transaction_date,
            "status": self.status
        }

class Escrow(db.Model):
    __tablename__="Escrow"
    Escrow_id=db.Column(db.Integer,primary_key=True)
    project_id=db.Column(db.Integer,db.ForeignKey("Projects.project_id"),nullable=False)
    amount_held=db.Column(db.Float,nullable=False)
    released_amount=db.Column(db.Float,default=0.0)
    status=db.Column(db.String(30),default="active") # active, completed, cancelled
    created_at=db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "Escrow_id": self.Escrow_id,
            "project_id": self.project_id,
            "amount_held": self.amount_held,
            "released_amount": self.released_amount,
            "status": self.status,
            "created_at": self.created_at
        }
class Milestone(db.Model):
    __tablename__="Milestone"
    milestone_id=db.Column(db.Integer,primary_key=True)
    project_id=db.Column(db.Integer,db.ForeignKey("Projects.project_id"),nullable=False)
    title=db.Column(db.String(200),nullable=False)
    description=db.Column(db.String(300),nullable=False)
    amount=db.Column(db.Float,default=0.0)
    deadline=db.Column(db.DateTime,nullable=True)
    status=db.Column(db.String(30),default="pending") # pending, completed, released

    def to_dict(self):
        return {
            "milestone_id": self.milestone_id,
            "project_id": self.project_id,
            "title": self.title,
            "description": self.description,
            "amount": self.amount,
            "deadline": self.deadline,
            "status": self.status
        }

class Client(db.Model):
    __tablename__="client"
    client_id=db.Column(db.Integer,primary_key=True)
    user_id=db.Column(db.Integer,db.ForeignKey("users.user_id"),nullable=False)
    company_name=db.Column(db.String(200),nullable=True)
    rating=db.Column(db.Float,default=0.0)
    verification_status=db.Column(db.String(30),default="unverified") # unverified, verified

    def to_dict(self):
        return {
            "client_id": self.client_id,
            "user_id": self.user_id,
            "company_name": self.company_name,
            "company_website": self.company_website,
            "rating": self.rating,
            "verification_status": self.verification_status
        }
    
class Deliverable(db.Model):
    __tablename__="Deliverable"
    deliverable_id=db.Column(db.Integer,primary_key=True)
    milestone_id=db.Column(db.Integer,db.ForeignKey("Milestone.milestone_id"),nullable=False)
    freelancer_id=db.Column(db.Integer,db.ForeignKey("Freelancer.freelancer_id"),nullable=False)
    file_path=db.Column(db.String(300),nullable=False)
    submission_date=db.Column(db.DateTime, default=datetime.utcnow)
    status=db.Column(db.String(30),default="submitted") # submitted, approved, rejected

    def to_dict(self):
        return {
            "deliverable_id": self.deliverable_id,
            "milestone_id": self.milestone_id,
            "freelancer_id": self.freelancer_id,
            "file_path": self.file_path,
            "submission_date": self.submission_date,
            "status": self.status
            
        }
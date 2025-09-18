from __future__ import annotations
from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from pathlib import Path

# --- Config ---
app = Flask(__name__, instance_relative_config=True)
app.config.update(
    SQLALCHEMY_DATABASE_URI=f"sqlite:///{Path(app.instance_path) / 'todo.db'}",
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
)

# ensure instance dir exists
Path(app.instance_path).mkdir(parents=True, exist_ok=True)

db = SQLAlchemy(app)

# --- Model ---
class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {"id": self.id, "text": self.text, "done": self.done}

# init db (simple way)
with app.app_context():
    db.create_all()

# --- Views ---
@app.get("/")
def index():
    return render_template("index.html")

# --- API ---
@app.get("/api/todos")
def list_todos():
    items = Todo.query.order_by(Todo.id.desc()).all()
    return jsonify([t.to_dict() for t in items])

@app.post("/api/todos")
def create_todo():
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400
    todo = Todo(text=text)
    db.session.add(todo)
    db.session.commit()
    return jsonify(todo.to_dict()), 201

@app.patch("/api/todos/<int:todo_id>")
def update_todo(todo_id: int):
    todo = Todo.query.get_or_404(todo_id)
    data = request.get_json(force=True, silent=True) or {}
    if "text" in data:
        text = (data.get("text") or "").strip()
        if not text:
            return jsonify({"error": "text cannot be empty"}), 400
        todo.text = text
    if "done" in data:
        todo.done = bool(data["done"])
    db.session.commit()
    return jsonify(todo.to_dict())

@app.delete("/api/todos/<int:todo_id>")
def delete_todo(todo_id: int):
    todo = Todo.query.get_or_404(todo_id)
    db.session.delete(todo)
    db.session.commit()
    return ("", 204)

if __name__ == "__main__":
    app.run(debug=True)
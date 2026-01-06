import sys
import os

# Add the backend directory to sys.path to import app
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.'))

from app import create_app, db
from app.models.document import Document

def update_existing_documents():
    app = create_app()
    with app.app_context():
        print("Updating existing documents with default tracking values...")
        
        # Update existing documents to ensure they have the new columns with default values
        documents = Document.query.all()
        updated_count = 0
        
        for doc in documents:
            if doc.view_count is None:
                doc.view_count = 0
                updated_count += 1
            if doc.download_count is None:
                doc.download_count = 0
                updated_count += 1
        
        if updated_count > 0:
            db.session.commit()
            print(f"Updated {updated_count} documents with default tracking values.")
        else:
            print("All documents already have tracking values.")

if __name__ == "__main__":
    update_existing_documents()
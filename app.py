from flask import Flask, jsonify
from flask_cors import CORS
from urllib.parse import unquote
from models import Book, Library, session  # Importiere deine existierenden Models und die Session

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Onleihe API is running!"

@app.route('/libraries')
def get_libraries():
    try:
        libraries = session.query(Library).all()
        return jsonify([{
            'id': lib.id,
            'name': lib.name,
            'baseURL': lib.baseURL,
            'country': lib.country
        } for lib in libraries])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/books/<isbn>')
def check_book(isbn):
    try:
        book = session.query(Book).filter_by(isbn=isbn).first()
        if book:
            return jsonify({
                'available': True,
                'title': book.title,
                'author': book.author,
                'libraries': [{'name': lib.name, 'baseURL': lib.baseURL} for lib in book.libraries]
            })
        return jsonify({
            'available': False,
            'message': 'Book not found'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/title/<query>')
def search_title(query):
    try:
        decoded_query = unquote(query)
        print(decoded_query)
        books = session.query(Book).filter(Book.title.ilike(f'%{decoded_query}%')).all()
        if books:
            return jsonify([{
                'title': book.title,
                'author': book.author,
                'isbn': book.isbn,
                'libraries': [{'name': lib.name, 'baseURL': lib.baseURL} for lib in book.libraries]
            } for book in books])
        return jsonify({
                    'available': False,
                    'message': 'Book not found'
                })   
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint zum Testen der Datenbankverbindung
@app.route('/test-db')
def test_db():
    try:
        # Versuche, die Anzahl der Bücher zu zählen
        book_count = session.query(Book).count()
        library_count = session.query(Library).count()
        return jsonify({
            'status': 'success',
            'book_count': book_count,
            'library_count': library_count
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
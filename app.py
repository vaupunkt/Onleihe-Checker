from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from models import Book, Library, session  # Importiere deine existierenden Models und die Session
from sqlalchemy import func

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Onleihe API is running!"

@app.route('/libraries', methods=['GET'])
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
    
@app.route("/library/<library_id>", methods=['GET'])
def get_library(library_id):
    try:
        library = session.query(Library).filter(Library.id == library_id).first()
        if library:
            books = session.query(Book).filter(Book.library_ids.contains(library_id)).all()
            return jsonify({
                'id': library.id,
                'name': library.name,
                'baseURL': library.baseURL,
                'country': library.country,
                'books': [{
                    'title': book.title,
                    'author': book.author,
                    'isbn': book.isbn,
                    'link': book.link
                } for book in books]
            })
        return jsonify({
            'message': 'Library not found'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/books/<isbn>', methods=['GET'])
def check_book(isbn):
    try:
        library_id = request.args.get('library')
        book = session.query(Book).filter_by(Book.isbn.in_(isbn)).first()
        if book and library_id:
            availableLibraries = book.library_ids.split('; ')
            if library_id in availableLibraries:
                libraries = session.query(Library).filter(Library.id.in_(availableLibraries)).all()
                return jsonify({
                    'available': True,
                    'title': book.title,
                    'author': book.author,
                    'isbn': book.isbn,
                    'link': book.link,
                    'libraries': [{'name': lib.name, 'baseURL': lib.baseURL, 'id': lib.id} for lib in libraries]
                })
        elif book:
            libraries = session.query(Library).filter(Library.id.in_(book.library_ids.split('; '))).all()
            return jsonify({
                    'available': True,
                    'title': book.title,
                    'author': book.author,
                    'isbn': book.isbn,
                    'link': book.link,
                    'libraries': [{'name': lib.name, 'baseURL': lib.baseURL, 'id': lib.id} for lib in libraries]
                })

        return jsonify({
            'available': False,
            'message': 'Book not found'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/title/<query>', methods=['GET'])
def search_title(query):
    try:
        library_id = request.args.get('library')
        decoded_query = unquote(query).lower()
        search_words = decoded_query.split(" ")
        query_filter = search_words[0]
        query = ' '.join(search_words[:1])
        query_filter = Book.title.ilike(f'%{query}%')
        books = session.query(Book)\
            .filter(query_filter)\
            .limit(10)\
            .all()
        words = 1
        while len(books) > 1 and words < len(search_words):
            words += 1
            query = ' '.join(search_words[:words])
            query_filter = Book.title.ilike(f'%{query}%')
            books = session.query(Book)\
                .filter(query_filter)\
                .all()
        if books[0] and library_id:
            book = books[0]
            availableLibraries = book.library_ids.split('; ')
            if library_id in availableLibraries:
                libraries = session.query(Library).filter(Library.id.in_(availableLibraries)).all()
                return jsonify({
                    'available': True,
                    'title': book.title,
                    'author': book.author,
                    'isbn': book.isbn,
                    'link': book.link,
                    'libraries': [{'name': lib.name, 'baseURL': lib.baseURL, 'id': lib.id} for lib in libraries]
                })
        elif books[0]:
            book = books[0]
            libraries = session.query(Library).filter(Library.id.in_(book.library_ids.split('; '))).all()
            return jsonify({
                    'available': True,
                    'title': book.title,
                    'author': book.author,
                    'isbn': book.isbn,
                    'link': book.link,
                    'libraries': [{'name': lib.name, 'baseURL': lib.baseURL, 'id': lib.id} for lib in libraries]
                })
        return jsonify({
                    'available': False,
                    'message': 'Book not found',
                    'query': query
                })   
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(app.run(host='0.0.0.0', port=8000))
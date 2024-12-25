from models import Library  # Importiere die Modelle und Session aus models.py

def store_libraries(libraries, Session):
    session = Session()

    for library in libraries:
        new_library = Library(
            name=library['name'],
            baseURL=library['baseURL'],
            country=library['country'],
            id=library['id']
        )
        session.merge(new_library)

    session.commit()

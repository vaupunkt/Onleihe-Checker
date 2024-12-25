from models import Category  # Importiere die Modelle und Session aus models.py


def store_categories(category_list, Session):
    session = Session()  # Create a new session for each run

    for category in category_list:
       new_category = Category(
           name=category['name'],
           link=category['link'],
              id=category['id']

       )
       session.merge(new_category)
    
    session.commit()

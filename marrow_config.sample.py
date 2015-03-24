from src.marrow.titlegetter import titlegetter
from src.marrow.titlegetter import nytimes

class config:
    debug = True
    secret_key = "<some random string>"
    db = "<theDatabaseName>"
    user = "<theDatabaseUser>"
    password = "<theDatabasePassword>"
    host = "localhost"
    titlegetter = titlegetter.TitleGetter()


from src.marrow.titlegetter import titlegetter
from src.marrow.titlegetter import nytimes

def instantiate(cls):
    return cls()

@instantiate
class config:
    debug = True
    secret_key = "VERRY SECRET"

    @instantiate
    class db:
        db = "<db name>"
        user = "<db user>"
        password = "<db password>"
        host = "<db host>"

    server_name = '<the server name>'

    titlegetter = titlegetter.TitleGetter()
    static_root = '<the static root>'
    event_root = '/events'

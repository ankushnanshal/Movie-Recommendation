from flask import Flask, render_template, request, redirect

app = Flask(__name__)

# Movie database (connect movies to pages)
movies = {

    # 🔴 MARVEL
    "spider man": "marvel.html",
    "spider man 2": "marvel.html",
    "spider man 3": "marvel.html",
    "spider man far from home": "marvel.html",
    "spider man homecoming": "marvel.html",
    "spider man no way home": "marvel.html",
    "iron man": "marvel.html",
    "iron man 2": "marvel.html",
    "iron man 3": "marvel.html",
    "captain america the first avenger": "marvel.html",
    "captain america the winter soldier": "marvel.html",
    "captain america civil war": "marvel.html",
    "thor": "marvel.html",
    "thor the dark world": "marvel.html",
    "thor ragnarok": "marvel.html",
    "thor love and thunder": "marvel.html",
    "venom": "marvel.html",
    "venom let there be carnage": "marvel.html",
    "venom the last dance": "marvel.html",
    "thunderbolts": "marvel.html",
    "the avengers": "marvel.html",
    "avengers age of ultron": "marvel.html",
    "avengers infinity war": "marvel.html",
    "avengers endgame": "marvel.html",
    "ant man": "marvel.html",
    "ant man and the wasp": "marvel.html",
    "ant man and the wasp quantumania": "marvel.html",
    "ghost rider": "marvel.html",
    "ghost rider spirit of vengeance": "marvel.html",
    "deadpool": "marvel.html",
    "deadpool 2": "marvel.html",
    "deadpool and wolverine": "marvel.html",
    "black panther": "marvel.html",
    "black panther wakanda forever": "marvel.html",
    "black widow": "marvel.html",
    "wandavision": "marvel.html",
    "daredevil": "marvel.html",
    "eternals": "marvel.html",
    "moon knight": "marvel.html",
    "hawkeye": "marvel.html",

    # 🔵 DC
    "lucifer": "dc.html",
    "batwoman": "dc.html",
    "batman begins": "dc.html",
    "the batman": "dc.html",
    "the flash": "dc.html",
    "dc league of super pets": "dc.html",
    "joker": "dc.html",
    "joker folie a deux": "dc.html",
    "shazam": "dc.html",
    "shazam fury of the gods": "dc.html",
    "blue beetle": "dc.html",
    "green lantern": "dc.html",
    "man of steel": "dc.html",
    "superman": "dc.html",
    "batman v superman dawn of justice": "dc.html",
    "black adam": "dc.html",
    "wonder woman": "dc.html",
    "wonder woman 1984": "dc.html",
    "zack snyders justice league": "dc.html",
    "justice league": "dc.html",

    # 🧟 ZOMBIE
    "evil eye": "zombie.html",
    "izombie": "zombie.html",
    "from": "zombie.html",
    "fear the walking dead": "zombie.html",
    "ash vs evil dead": "zombie.html",
    "day of the dead": "zombie.html",
    "the last of us": "zombie.html",
    "rise of the zombie": "zombie.html",
    "zombie reddy": "zombie.html",
    "gangnam zombie": "zombie.html",
    "zombie ka aatank": "zombie.html",
    "zombie shark": "zombie.html",
    "daybreakers": "zombie.html",
    "death valley": "zombie.html",
    "all of us are dead": "zombie.html",
    "resident evil": "zombie.html",
    "resident evil apocalypse": "zombie.html",
    "resident evil extinction": "zombie.html",
    "resident evil afterlife": "zombie.html",
    "resident evil retribution": "zombie.html",
    "resident evil the final chapter": "zombie.html",
    "zombie apocalypse": "zombie.html",
    "zombie town": "zombie.html",
    "world war four": "zombie.html",

    # 🤖 TRANSFORMERS
    "bumblebee": "transformers.html",
    "transformers": "transformers.html",
    "transformers revenge of the fallen": "transformers.html",
    "transformers dark of the moon": "transformers.html",
    "transformers age of extinction": "transformers.html",
    "transformers the last knight": "transformers.html",
    "transformers rise of the beasts": "transformers.html",

    # ❤️ ROMANTIC
    "tere ishq mein": "romantic.html",
    "spring fever": "romantic.html",
    "dragon": "romantic.html",
    "the royals": "romantic.html",
    "genie make a wish": "romantic.html",
    "titanic": "romantic.html",
    "titanic 2": "romantic.html",
    "aankhon ki gustaakhiyan": "romantic.html",
    "raanjhanaa": "romantic.html",
    "saiyaara": "romantic.html",
    "dhadak": "romantic.html",
    "dhadak 2": "romantic.html",
    "param sundari": "romantic.html",
    "our fault": "romantic.html",
    "radhe shyam": "romantic.html",
    "bawaal": "romantic.html",
    "haseen dillruba": "romantic.html",
    "mere husband ki biwi": "romantic.html",
    "mr bachchan": "romantic.html",
    "tu jhoothi main makkaar": "romantic.html",
    "gutar gu": "romantic.html",
    "my fault london": "romantic.html",
    "tera kya hoga lovely": "romantic.html",
    "sita ramam": "romantic.html",
    "premalu": "romantic.html",
    "sanam teri kasam": "romantic.html",
    "dada": "romantic.html",
    "aap jaisa koi": "romantic.html",
    "de de pyaar de": "romantic.html",
    "de de pyaar de 2": "romantic.html"
}
@app.route('/search', methods=['POST'])
def search():
    query = request.form.get('movie', '').lower().strip()

    if not query:
        return "Enter movie name"

    for name, page in movies.items():
        if query in name or name in query:
            return render_template(page)

    return "Movie not found"

# routes for pages
@app.route('/marvel')
def marvel():
    return render_template("marvel.html")

@app.route('/dc')
def dc():
    return render_template("dc.html")

@app.route('/zombie')
def zombie():
    return render_template("zombie.html")

@app.route('/transformers')
def transformers():
    return render_template("transformers.html")

@app.route('/romantic')
def romantic():
    return render_template("romantic.html")

app.run(debug=True)
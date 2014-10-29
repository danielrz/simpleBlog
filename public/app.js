/**
 * Created with IntelliJ IDEA.
 * User: danielr
 * Date: 10/25/14
 * Time: 11:59 AM
 * To change this template use File | Settings | File Templates.
 */
/*--------------------------------------------
 Déclaration des librairies
 --------------------------------------------*/

var http = require('http'),
    express = require('express'),
    nStore = require('nstore'),
    bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

nStore = nStore.extend(require('nstore/query')());

//app.use(express.urlencoded());
//app.use(express.methodOverride());
console.log(__dirname);
app.use(express.static(__dirname));
/*app.use(express.cookieParser('ilovebackbone'));
 app.use(express.session({
 secret: "ilovebackbone"
 }));*/

/**
 * afin de tester l'API sans implementer backbone, executer nodemon public/app.js, cela va charger la page index.html par defaut.
 * ouvrir la console et executer pour la creation:
 * $.ajax({
  type: "POST",
  url: "/blogposts",
  data: {
    title: "My 3rd post",
    message: "Nous sommes partis pour ..."
  },
  dataType: 'json',
  error: function(err) {
    console.log(err);
  },
  success: function(dataFromServer) {
    console.log(dataFromServer);
  }
})

 ou pour obtenir toute la liste:
 $.ajax({
  type: "GET",
  url: "/blogposts",
  error: function(err) {
    console.log(err);
  },
  success: function(dataFromServer) {
    console.log(dataFromServer);
  }
})
 */

/*--------------------------------------------
 Définition des "bases" posts & users
 --------------------------------------------*/
var posts, users;

posts = nStore.new("blog.db", function () {
    users = nStore.new("users.db", function () {
        /*
         une fois les bases ouvertes, on passe
         en attente de requête http (cf. code de
         la fonction Routes())
         Si les bases n'existent pas,
         elles sont crées automatiquement
         */
        Routes();
        app.listen(3000);
        console.log('Express app started on port 3000');

    });
});

/*======= Authentification =======*/

var connectedUsers = [];
function addUser(user) {
    users.save(null, user, function (err, key) {
        if (err) {
            console.log("Erreur : ", err);
        } else {
            user.id = key;
            console.log(user);
        }
    });
}
function addUsers() {
    addUser({
        email: "bob@morane.com", password: "backbone", isAdmin: true,
        firstName: "Bob", lastName: "Morane"
    });
    addUser({
        email: "sam@lepirate.com", password: "underscore", isAdmin: false,
        firstName: "Sam", lastName: "Le Pirate"
    });
//etc. ...
}

function Routes() {
    /*
     Obtenir la liste de tous les posts lorsque
     l'on appelle http://localhost:3000/blogposts
     en mode GET
     */
    app.get('/blogposts', function (req, res) {
        console.log("GET (ALL) : /blogposts");
        posts.all(function (err, results) {
            if (err) {
                console.log("Erreur : ", err);
                res.json(err);
            } else {
                var posts = [];
                for (var key in results) {
                    var post = results[key];
                    post.id = key;
                    posts.push(post);
                }
                res.json(posts);
            }
        });
    });

    /*
     Obtenir la liste de tous les posts correspondant à un critère
     lorsque l'on appelle http://localhost:3000/blogposts/query/ en
     mode GET avec une requête en paramètre
     ex : query : { "title" : "Mon 1er post"} }
     */
    app.get('/blogposts/query/:query', function (req, res) {
        console.log("GET (QUERY) : /blogposts/query/" + req.params.query);

        posts.find(JSON.parse(req.params.query), function (err, results) {
            if (err) {
                console.log("Erreur : ", err);
                res.json(err);
            } else {
                var posts = [];
                for (var key in results) {
                    var post = results[key];
                    post.id = key;
                    posts.push(post);
                }
                res.json(posts);
            }
        });

    });

    /*
     Retrouver un post par sa clé unique lorsque
     l'on appelle http://localhost:3000/blogposts/identifiant_du_post
     en mode GET
     */

    app.get('/blogposts/:id', function (req, res) {
        console.log("GET : /blogposts/" + req.params.id);
        posts.get(req.params.id, function (err, post, key) {
            if (err) {
                console.log("Erreur : ", err);
                res.json(err);

            } else {
                post.id = key;
                res.json(post);
            }
        });
    });

    /*
     Créer un nouveau post lorsque
     l'on appelle http://localhost:3000/blogpost
     avec en paramètre le post au format JSON
     en mode POST
     */
    app.post('/blogposts', function (req, res) {
        console.log("POST CREATE ", req.body);

        var d = new Date(),
            model = req.body;
        model.saveDate = (d.valueOf());

        posts.save(null, model, function (err, key) {
            if (err) {
                console.log("Erreur : ", err);
                res.json(err);
            } else {
                model.id = key;
                res.json(model);
            }
        });
    });


    /*
     Mettre à jour un post lorsque
     l'on appelle http://localhost:3000/blogpost
     avec en paramètre le post au format JSON
     en mode PUT
     */
    app.put('/blogposts/:id', function (req, res) {
        console.log("PUT UPDATE", req.body, req.params.id);

        var d = new Date(),
            model = req.body;
        model.saveDate = (d.valueOf());

        posts.save(req.params.id, model, function (err, key) {
            if (err) {
                console.log("Erreur : ", err);
                res.json(err);
            } else {
                res.json(model);
            }
        });
    });

    /*
     supprimer un post par sa clé unique lorsque
     l'on appelle http://localhost:3000/blogpost/identifiant_du_post
     en mode DELETE
     */
    app.delete('/blogposts/:id', function (req, res) {
        console.log("DELETE : /delete/" + req.params.id);

        posts.remove(req.params.id, function (err) {
            if (err) {
                console.log("Erreur : ", err);
                res.json(err);
            } else {
                //petit correctif de contournement (bug ds nStore) :
                //ré-ouvrir la base lorsque la suppression a été faite
                posts = nStore.new("blog.db", function () {
                    res.json(req.params.id);
                    //Le modèle est vide si on ne trouve rien
                });
            }
        });
    });


}


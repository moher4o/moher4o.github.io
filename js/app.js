$(() => {
    const app = Sammy('#container', function () {
        this.use('Handlebars', 'hbs');

        this.get('#/home', getWelcomePage);
        this.get('index.html', getWelcomePage);
        function getWelcomePage(ctx) {
            if (!auth.isAuth()) {
                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    // loginForm: './templates/forms/loginForm.hbs',
                    // registerForm: './templates/forms/registerForm.hbs',
                }).then(function () {
                    this.partial('./templates/welcome_anonymous.hbs');
                })
            } else {
                ctx.redirect('#/catalog');
            }

        }

        this.get('#/register', (ctx) => {
            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                register: './templates/forms/registerForm.hbs',
            }).then(function () {
                this.partial('./templates/registerPage.hbs');
            })
        })
        this.post('#/register', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let repeatPass = ctx.params.repeatPass;

            if (repeatPass !== password) {
                notify.showError('Passwords must match!');
            } else {
                auth.register(username, password)
                    .then((userData) => {
                        auth.saveSession(userData);
                        notify.showInfo('User registration successful!');
                        ctx.redirect('#/catalog');
                    })
                    .catch(notify.handleError);
            }
        });

        this.get('#/login', (ctx) => {
            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                login: './templates/forms/loginForm.hbs',
            }).then(function () {
                this.partial('./templates/loginPage.hbs');
            })
        })
        this.post('#/login', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;
            if (username === '' || password === '') {
                notify.showError('All fields should be non-empty!');
            } else {
                auth.login(username, password)
                    .then((userData) => {
                        auth.saveSession(userData);
                        notify.showInfo('Login successful.');
                        ctx.redirect('#/catalog');
                    })
                    .catch(notify.handleError);
            }
        });

        this.get('#/logout', (ctx) => {
            auth.logout()
                .then(() => {
                    sessionStorage.clear();
                    ctx.redirect('#/home');
                })
                .catch(notify.handleError);
        });

        this.get('#/catalog', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            products.getAllProducts()
                .then((products) => {
                    products.forEach((p, i) => {
                        p.isAuthor = p._acl.creator === sessionStorage.getItem('userId');
                        p.imageUrl = p.image !== undefined
                    });

                    ctx.isAuth = auth.isAuth();
                    ctx.username = sessionStorage.getItem('username');
                    ctx.products = products;


                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        product: './templates/products/productDetaledView.hbs'
                    }).then(function () {
                        this.partial('./templates/products/productsListPageDetailedView.hbs');
                    })
                })
                .catch(notify.handleError);
        });

        this.get('#/details/product/:_id', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            products.getProductById(ctx.params._id)
                .then((product) => {

                    ctx.isAuth = auth.isAuth();
                    ctx.username = sessionStorage.getItem('username');
                    ctx.product = product;
                    ctx.imageUrl = product.image !== undefined

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                    }).then(function () {
                        this.partial('./templates/products/productDetails.hbs');
                    })

                })
                .catch(notify.handleError);
        })

        this.get('#/create/product', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            ctx.isAuth = auth.isAuth();
            ctx.username = sessionStorage.getItem('username');

            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
            }).then(function () {
                this.partial('./templates/products/createProductPage.hbs');
            })
        });
        this.post('#/create/product', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            let publisher = sessionStorage.getItem('username');
            let price = Number(ctx.params.price).toFixed(2)
            let datePublished = ctx.params.datePublished;
            let title = ctx.params.title;
            let description = ctx.params.description;
            let image = ctx.params.image

            if (title === '') {
                notify.showError('Title is required!');
            } else if (price === undefined) {
                notify.showError('Price is required!');
            } else if (datePublished === '') {
                notify.showError('Date must be a valid date!');
            } else {
                products.createProduct(publisher, title, description, price, datePublished, image)
                    .then(() => {
                        notify.showInfo('Ad created.');
                        ctx.redirect('#/catalog');
                    })
                    .catch(notify.handleError);
            }
        });

        this.get('#/edit/product/:_id', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            let productId = ctx.params._id;
           // alert(productId)
            products.getProductById(productId)
                .then((product) => {
                    ctx.isAuth = auth.isAuth();
                    ctx.username = sessionStorage.getItem('username');
                    ctx.imageUrl = product.image !== undefined
                    ctx.product = product;

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                    }).then(function () {
                        this.partial('./templates/products/editProductPage.hbs');
                    })
                })
        });
        this.post('#/edit/product', (ctx) => {
            let productId = ctx.params.id;
            let publisher = sessionStorage.getItem('username');
            let price = ctx.params.price;
            let datePublished = ctx.params.datePublished;
            let image = ctx.params.image;
            let title = ctx.params.title;
            let description = ctx.params.description;

                products.editProduct(productId, publisher, title, description, price, datePublished, image)
                    .then(() => {
                        notify.showInfo(`Ad ${title} updated.`);
                        ctx.redirect('#/catalog');
                    })
                    .catch(notify.showError);
        });

        this.get('#/delete/product/:_id', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            let productId = ctx.params._id;

            products.deleteProduct(productId)
                .then(() => {
                    notify.showInfo('Ad deleted.');
                    ctx.redirect('#/catalog');
                })
                .catch(notify.handleError);
        });

        this.get('#/products', (ctx) => {
            if (!auth.isAuth()) {
                ctx.redirect('#/home');
                return;
            }

            products.getMyProducts(sessionStorage.getItem('username'))
                .then((products) => {
                    products.forEach((p, i) => {
                        p.isAuthor = p._acl.creator === sessionStorage.getItem('userId');
                        p.imageUrl = p.image !== undefined
                    });
                    ctx.isAuth = auth.isAuth();
                    ctx.username = sessionStorage.getItem('username');
                    ctx.products = products;

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        product: './templates/products/productDetaledView.hbs'
                    }).then(function () {
                        this.partial('./templates/products/myProductsList.hbs');
                    });
                })
        });

    });

    app.run();
});
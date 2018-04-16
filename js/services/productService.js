let products = (() => {
    function getAllProducts() {
        const endpoint = 'products?query={}&sort={"_kmd.ect": -1}';

        return remote.get('appdata', endpoint, 'kinvey');
    }
    
    function createProduct(publisher, title, description, price, datePublished, image) {
        let data = { publisher, title, description, price, datePublished, image };

        return remote.post('appdata', 'products', 'kinvey', data);
    }

    function editProduct(productId, publisher, title, description, price, datePublished, image) {
        const endpoint = `products/${productId}`;
        let data = { productId, publisher, title, description, price, datePublished, image };

        return remote.update('appdata', endpoint, 'kinvey', data);
    }
    
    function deleteProduct(productId) {
        const endpoint = `products/${productId}`;

        return remote.remove('appdata', endpoint, 'kinvey');
    }

    function getMyProducts(username) {
        const endpoint = `products?query={"publisher":"${username}"}&sort={"_kmd.ect": -1}`;

        return remote.get('appdata', endpoint, 'kinvey');
    }

    function getProductById(productId) {
        const endpoint = `products/${productId}`;

        return remote.get('appdata', endpoint, 'kinvey');
    }

    return {
        getAllProducts,
        createProduct,
        editProduct,
        deleteProduct,
        getProductById,
        getMyProducts
    }
})();
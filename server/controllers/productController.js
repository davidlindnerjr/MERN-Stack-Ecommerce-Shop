import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';

// Get all products
// route: Get /api/products
// access Public
const getProducts = asyncHandler(async (req, res) => {

    const pageSize = 4;
    const page = Number(req.query.pageNumber) || 1;
    
    //How you get query from the url for product search
    const keyword = req.query.keyword ? {
        name: {
            $regex: req.query.keyword,
            // i - means case insensitive
            $options: 'i'
        }
    } : {}

    const count = await Product.countDocuments({...keyword});

    const products = await Product.find({...keyword}).limit(pageSize).skip(pageSize * (page - 1));

    res.json({products, page, pages: Math.ceil(count / pageSize)});
})

// desc: Get single product
// route: Get /api/products/:id
// access Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)

    if(product){
        res.json(product)
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
})

// desc: Delete a product
// route: DELETE /api/products/:id
// access: private/ admin
const deleteProduct = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id);

    if(product){
        await product.remove();
        res.json({ message: 'Product removed' })
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
})

// desc: Create a product
// route: POST /api/products
// access: private/ admin
const createProduct = asyncHandler(async (req, res) => {

    const product = new Product({
        name: 'Sample Name',
        price: 0,
        user: req.user._id,
        image: '/images/sample.jpg',
        brand: 'Sample Brand',
        category: 'Sample Category',
        countInStock: 0,
        numReviews: 0,
        description: 'Sample Description'
    })

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
})

// desc: Update a Product
// route: PUT /api/products/:id
// access: private/ admin
const updateProduct = asyncHandler(async (req, res) => {
    const {
      name,
      price,
      description,
      image,
      brand,
      category,
      countInStock,
    } = req.body
  
    const product = await Product.findById(req.params.id)
  
    if (product) {
      product.name = name
      product.price = price
      product.description = description
      product.image = image
      product.brand = brand
      product.category = category
      product.countInStock = countInStock
  
      const updatedProduct = await product.save()
      res.json(updatedProduct)
    } else {
      res.status(404)
      throw new Error('Product not found')
    }
  })

// desc: Create new review
// route: POST /api/products/:id/reviews
// access: private
const createProductReview = asyncHandler(async (req, res) => {
    const {
        rating,
        comment
    } = req.body
  
    const product = await Product.findById(req.params.id)
  
    if (product) {
        const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString())
  
        if(alreadyReviewed){
            res.status(400);
            throw new Error('Product already reviewed')
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id
        }

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, curr) => curr.rating + acc, 0) / product.reviews.length;

        await product.save();
        res.status(201).json({message: 'Review added'})

    } else {
      res.status(404)
      throw new Error('Product not found')
    }
  })

// desc: Get top rated products
// route: GET /api/products/top
// access: public
const getTopProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ rating: -1 }).limit(3);
    res.json(products);
})

export { getProductById, getProducts, deleteProduct, createProduct, updateProduct, createProductReview, getTopProducts };
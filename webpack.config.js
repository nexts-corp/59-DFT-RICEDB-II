module.exports = {
    entry: [
        './public/src/redux-store/index.js'
    ],
    output: {
        filename: './public/src/redux-store.js'
    },
    watch: true,
    devtool:"inline-source-map"
};


// module.exports = {
//     entry: [
//         './public/src/redux-store/index.js'
//     ],
//     output: {
//         filename: './public/src/redux-store.js'
//     },
//     module: {
//         loaders: [
//             {
//                 exclude: /node_modules/,
//                 loader: 'babel',
//                 query: {
//                     presets: ['es2015']
//                 }
//             }
//         ]
//     },
//     watch: true
// };
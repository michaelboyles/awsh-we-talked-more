module.exports = [
    {
        name: 'Server',
        mode: 'production',
        entry: './create-comment-request-handler.ts',
        entry: {
            'create-comment-request-handler': './server/create-comment-request-handler.ts',
            'get-comments': './server/get-comments.ts'
        },
        output: {
            filename: '[name].js',
            library: 'main',
            libraryTarget: 'commonjs2'
        },
        target: 'node',
        resolve: {
            extensions: ['.ts', '.tsx', '.js']
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'ts-loader',
                        options: {
                            configFile: "server/tsconfig.json"
                        }
                    }]
                }
            ]
        },
        externals: ['aws-sdk']
    },
    {
        name: 'Client',
        mode: 'production',
        entry: './client/index.tsx',
        output: {
            filename: 'index.js'
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js']
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'ts-loader',
                        options: {
                            configFile: "client/tsconfig.json"
                        }
                    }]
                },
                {
                    test: /\.scss$/,
                    use: ['style-loader', 'css-loader', 'sass-loader']
                }
            ]
        }
    }
]
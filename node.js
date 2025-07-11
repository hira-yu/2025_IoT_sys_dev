//------------------------------------------------------------//
// ./js/node.js
// Create : 2025/06/13
// Node.js サーバー
//------------------------------------------------------------//

const express = require( 'express' );
const api = require( "./api/" );
const app = express( );

app.use( express.static( 'public' ));
app.use( "/api", api );

app.listen( 3000, ( ) => {
    console.log( 'Start server port:3000' );
});

app.use(( req, res ) => {
    res.sendStatus( 404 );
});
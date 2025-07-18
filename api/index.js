const express = require( "express" );
const router = express.Router( );
var Obniz = require( "obniz" );

var { PythonShell } = require( "python-shell" );

const fs = require( 'fs' );

router.use( express.json( ));
router.use( express.urlencoded({
    extended: true,
    limit: '100mb'
}));

router.get( "/", async ( req, res ) => {
    switch( req.query.req ) {
        case "forecasts":
            res.sendFile( __dirname + "/json/forecasts.json", ( err ) => {
                if( err ) {
                    res.status( err.status );
                } else {
                    res.status( 200 );
                }
            });
            break;

        case "warnings":
            res.sendFile( __dirname + "/json/warnings.json", ( err ) => {
                if( err ) {
                    res.status( err.status );
                } else {
                    res.status( 200 );
                }
            });
            break;

        case "config":
            res.sendFile( __dirname + "/json/config.json", ( err ) => {
                if( err ) {
                    res.status( err.status );
                } else {
                    res.status( 200 );
                }
            });
            break;

        case "temps":
            var obniz = new Obniz( "9964-7739" );
            var connect = await obniz.connectWait({ timeout: 10 });

            if( connect ) {
                await obniz.wait( 500 );
                try {
                    obniz.i2c0.start({ mode: "master", gnd: 8, sda: 10, scl: 11, clock: 400000 });
                    obniz.i2c0.onerror = ( err ) => {
                        console.log( err );
                    }
                    await obniz.wait( 100 );
                    obniz.i2c0.write( 0x44, [ 0xFD ]);
                    await obniz.wait( 20 );

                    var data = await obniz.i2c0.readWait( 0x44, [ 6 ]);

                    t_ticks = ( data[ 0 ] << 8 ) + data[ 1 ];
                    checksum_t = data[ 2 ];
                    h_ticks = ( data[ 3 ] << 8 ) + data[ 4 ];
                    checksum_h = data[ 5 ];

                    temp = -45 + 175 * t_ticks / 65535;
                    hum  =  -6 + 125 * h_ticks / 65535;

                    if ( hum > 100 ) {
                        hum = 100;
                    }
                    if ( hum < 0 ) {
                        hum = 0;
                    }

                    res.json({ status: 200, temp: temp.toFixed( 2 ), hum:  hum.toFixed( 2 )});

                } finally {
                    obniz.close( );
                }
            } else {
                obniz.close( );
                res.json({ status: 503 });
            }
            break;

        case "ir_recv":
            var obniz = new Obniz( "9964-7739" );
            var connect = await obniz.connectWait({ timeout: 20 });

            if( connect ) {
                try {
                    let ir_module = obniz.wired( "IRModule", { vcc: 0, send: 1, recv: 2, gnd: 3 });
                    await obniz.wait( 100 );
                    let ir_data = null;
                    ir_module.cutTail = true;

                    await ir_module.start( async ( arr ) => {
                        ir_data = arr;

                        obniz.close( );
                        res.json({ status: 200, data: ir_data });
                    });

                } finally {
                    obniz.close( );
                }
            } else {
                obniz.close( );
                res.json({ status: 503 });
            }
            break;

        case "ir_send":
            var obniz = new Obniz( "9964-7739" );
            var connect = await obniz.connectWait({ timeout: 20 });

            if( connect ) {
                try {
                    let ir_module = obniz.wired( "IRModule", { vcc: 0, send: 1, recv: 2, gnd: 3 });

                    ir_module.send( req.query.data );
                } finally {
                    obniz.close( );
                }

            } else {
                obniz.close( );
                res.json({ status: 503 });
            }
            break;
    }
});

router.post( "/", async ( req, res ) => {
    switch( req.query.post ){
        case "ir_send":
            var py_script = new PythonShell( './py/ir_analy.py' );
            py_script.send( req.body[ "data" ][ 0 ] );

            py_script.on( "message", async ( message ) => {
                var obniz = new Obniz( "9964-7739" );
                var connect = await obniz.connectWait({ timeout: 20 });

                if( connect ) {
                    try {
                        data = JSON.parse( fs.readFileSync( __dirname + "/json/config.json", "utf-8" ));

                        let ir_module = obniz.wired( "IRModule", { vcc: 0, send: 1, recv: 2, gnd: 3 });

                        if( !( data.air.toString( ) == ( req.body["data"][ 0 ].split( "," ).slice( 1, 9 )).toString( ))) {
                            ir_module.send( message.slice( 1, -1 ).split(", ").map( Number ));
                            await obniz.wait( 200 );

                            data.air = req.body[ "data" ][ 0 ].split( "," ).slice( 1, 9 );
                            data.air[ 4 ] = Number( data.air[ 4 ]);

                            fs.writeFile( __dirname + "/json/config.json", JSON.stringify( data, null, 4 ), ( err ) => {
                                if( err ) throw err;
                            });
                        }
                    } finally {
                        obniz.close( );
                    }
                } else {
                    obniz.close( );
                    res.sendStatus( 503 );
                    return;
                }

                res.sendStatus( 200 );
            });
    }
} )

module.exports = router;
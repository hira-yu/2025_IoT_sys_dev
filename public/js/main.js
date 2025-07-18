//------------------------------------------------------------//
// ./js/main.js
// Create : 2025/06/13
// 主要処理
//------------------------------------------------------------//

const weekday = [ "日","月","火","水","木","金","土" ];
var forecast, warnings, config = { };

const get_config = $.getJSON( './api/?req=config', ( data ) => {
    config = data;
});

const get_forecasts = $.getJSON( './api/?req=forecasts', ( data ) => {
    forecast = data[ "forecasts" ][ 0 ];
});

const get_warnings = $.getJSON( './api/?req=warnings', ( data ) => {
    warnings = data[ "warnings" ][ 0 ];
});

Promise.allSettled(
    [ get_config, get_forecasts, get_warnings ]
).then(( ) => {
    initialize_remote_control( );
    main_loop( );
});

function render_weather( ) {
    var weather = get_weather( config.area.pref, config.area.city );

    weather.then(( res ) => {
        let current_date = new Date( );
        let today_date = new Date( current_date ).setHours( 0, 0, 0, 0 );

        // html initialize
        $( "#today_temp_min" ).text( "--" );
        $( "#today_temp_max" ).text( "--" );
        $( "#tomorrow_temp_min" ).text( "--" );
        $( "#tomorrow_temp_max" ).text( "--" );
        $( "#today_pops > tbody > tr > td:nth-of-type(1)" ).text( "--" );
        $( "#today_pops > tbody > tr > td:nth-of-type(2)" ).text( "--" );
        $( "#today_pops > tbody > tr > td:nth-of-type(3)" ).text( "--" );
        $( "#tomorrow_pops > tbody > tr > td:nth-of-type(1)" ).text( "--" );
        $( "#tomorrow_pops > tbody > tr > td:nth-of-type(2)" ).text( "--" );

        $( "#today_weather_icon" ).attr( "alt", res[ 0 ][ 1 ][ 0 ]);
        $( "#tomorrow_weather_icon" ).attr( "alt", res[ 0 ][ 1 ][ 1 ]);

        if( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 16 ){
            $( "#today_weather_icon" ).attr( "src", `../img/forecasts/${ forecast[ res[ 0 ][ 0 ][ 0 ]][ 0 ] }` );
            $( "#today_date" ).text( "今日 " + get_date( 0 ));
        } else {
            $( "#today_weather_icon" ).attr( "src", `../img/forecasts/${ forecast[ res[ 0 ][ 0 ][ 0 ]][ 1 ] }` );
            $( "#today_date" ).text( "今夜 " + get_date( 0 ));
        }

        $( "#tomorrow_date" ).text( "明日 " + get_date( 1 ));
        $( "#tomorrow_weather_icon" ).attr( "src", `../img/forecasts/${ forecast[ res[ 0 ][ 0 ][ 1 ]][ 0 ] }` );

        var warning_elems = ""

        for( var i = 0; i < res[ 1 ][ 1 ].length; i++ ) {
            if( res[ 1 ][ 1 ][ i ].status != "解除" ) {
                let warning = res[ 1 ][ 1 ][ i ].code;
                warning_elems += `<p class = "warning-label level_${ warning / 10 | 0 }">${ warnings[ warning ]}</p>`;
            }
        }

        $( "#warnings" ).text( "" );

        if( 0 < warning_elems.length ) {
            $( "#warnings" ).append( warning_elems );
        } else {
            $( "#warnings" ).append( `<p class = "warning-label">発令中の警報・注意報はありません</p>` )
        }

        let forecast_current_dates = [ new Date( today_date ).setHours( -5, 0, 0, 0 )];

        forecast_current_dates.push( new Date( today_date ).setHours(  9 - 5 ));
        forecast_current_dates.push( new Date( today_date ).setHours( 24 - 5 ));
        forecast_current_dates.push( new Date( today_date ).setHours( 33 - 5 ));

        for( var i = 0; i < res[ 0 ][ 2 ].length; i++ ) {
            let date = new Date( Date.parse( res[ 0 ][ 6 ][ 2 ][ i ]));
            date.setHours( date.getHours( ) - 5 );
            date = date.getTime( );

            switch( date ) {
                case forecast_current_dates[ 0 ]:
                    if( i == 0 ) {
                        $( "#today_temp_min" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                        if( !( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 15 )){
                            $( "#tomorrow_temp_min" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                        }
                    }
                    break;

                case forecast_current_dates[ 1 ]:
                    if( !( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 15 )){
                        $( "#tomorrow_temp_max" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    } else {
                        $( "#today_temp_max" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    }
                    break;

                case forecast_current_dates[ 2 ]:
                    $( "#tomorrow_temp_min" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    if( !( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 15 )){
                        $( "#today_temp_min" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    }
                    break;

                case forecast_current_dates[ 3 ]:
                    $( "#tomorrow_temp_max" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    break;
            }
        }

        if( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 16 ){
            var pops_current_dates = [ new Date( today_date ).setHours( 6 )];

            pops_current_dates.push( new Date( today_date ).setHours( 12 ));
            pops_current_dates.push( new Date( today_date ).setHours( 18 ));
            pops_current_dates.push( new Date( today_date ).setHours( 24 ));
            pops_current_dates.push( new Date( today_date ).setHours( 36 ));
        } else {
            var pops_current_dates = [ new Date( current_date ).setDate( -2, 0, 0, 0, 0, 0 )];

            pops_current_dates.push( new Date( today_date ).setHours( 12 ));
            pops_current_dates.push( new Date( today_date ).setHours( 18 ));
            pops_current_dates.push( new Date( today_date ).setHours( 24 ));
            pops_current_dates.push( new Date( today_date ).setHours( 36 ));
        }

        for( var i = 0; i < res[ 0 ][ 3 ].length; i++ ) {
            let date = Date.parse( res[ 0 ][ 6 ][ 1 ][ i ]);

            switch( date ) {
                case pops_current_dates[ 0 ]:
                    $( "#today_pops > tbody > tr > td:nth-of-type(1)").text( `${ res[ 0 ][ 3 ][ i ] }%` );
                    break;

                case pops_current_dates[ 1 ]:
                    if( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 15 ){
                        $( "#today_pops > tbody > tr > td:nth-of-type(2)").text( `${ res[ 0 ][ 3 ][ i ] }%` );
                    } else {
                        $( "#tomorrow_pops > tbody > tr > td:nth-of-type(1)").text( `${ res[ 0 ][ 3 ][ i ] }%` );
                    }
                    break;

                case pops_current_dates[ 2 ]:
                    if( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 15 ){
                        $( "#today_pops > tbody > tr > td:nth-of-type(3)").text( `${ res[ 0 ][ 3 ][ i ] }%` );
                    } else {
                        $( "#tomorrow_pops > tbody > tr > td:nth-of-type(2)").text( `${ res[ 0 ][ 3 ][ i ] }%` );
                    }
                    break;

                case pops_current_dates[ 3 ]:
                    $( "#tomorrow_pops > tbody > tr > td:nth-of-type(1)").text( `${ Math.max( res[ 0 ][ 3 ][ i ], res[ 0 ][ 3 ][ i + 1 ])}%` );
                    break;

                case pops_current_dates[ 4 ]:
                    $( "#tomorrow_pops > tbody > tr > td:nth-of-type(2)").text( `${ Math.max( res[ 0 ][ 3 ][ i ], res[ 0 ][ 3 ][ i + 1 ])}%` );
                    break;
            }
        }
    });
}

function get_date( num ) {
    let date = new Date( );
    date.setDate( date.getDate( ) + num );
    date.setHours( date.getHours( ) - 5 );

    let month = date.getMonth( ) + 1;
    let day   = date.getDate( );
    let week  = weekday[ date.getDay( )];

    return `${ month }月${ day }日（${ week }）`;
}

function calc_THI( T, H ) {
    return ( 0.81 * T + 0.01 * H * ( 0.99 * T - 14.3 ) + 46.3 ).toFixed( 2 );
}

function recalc_THI( H ) {
    return Math.round(( 158.8 * H + 26500 ) / ( 900 + 11 * H ));
}

function calc_WBGT( T, H ) {
    return ( 0.8951 * T + 0.1181 * H - 8.2356 ).toFixed( 2 );
}

function get_temps( ) {
    data = new Promise(( resolve, reject ) => {
        $.ajax({
            url: "/api?req=temps",
            async: true,
            type: "GET",
            dataType: "json",
        })
        .done( function( data ){
            resolve( data );
        })
        .fail( function( ){
            reject( );
        });
    });

    data.then(( res ) => {
        if( res.status != 200 || ( res.temp == 130 && res.hum == 100 )) {
            console.log( "データが取得できませんでした" );
            return;
        }

        var thi = decision_THI( calc_THI( res.temp, res.hum ));
        var wbgt = decision_WBGT( calc_WBGT( res.temp, res.hum ));

        $( "#monitor_temp" ).text( res.temp );
        $( "#monitor_hum" ).text( res.hum );
        $( "#monitor_THI" ).text( thi[ 0 ]);
        $( "#monitor_WBGT" ).text( wbgt[ 0 ]);

        $( "#THI_box" ).addClass( `attn_${ thi[ 1 ]}` );
        $( "#WBGT_box" ).addClass( `attn_${ wbgt[ 1 ] * 2 + 2 }` );
    });
}

async function get_ir( ) {
    data = await new Promise(( resolve, reject ) => {
        $.ajax({
            url: "/api?req=ir",
            async: true,
            type: "GET",
            dataType: "json",
            timeout: 10000.
        })
        .done( function( data ){
            resolve( data );
        })
        .fail( function( ){
            reject( );
        });
    });

    return data;
}

function render_air_info( ){
    let power       = [ "on", "off" ];
    let power_label = [ "入", "切" ];

    let mode       = [ "heat", "cool", "dry", "dry_low", "auto" ];
    let mode_label = [ "暖房", "冷房", "除湿", "除湿（弱）", "自動" ];
    let mode_imgs  = [ "./img/air/heat.png", "./img/air/cool.png", "./img/air/dry.png", "./img/air/dry_low.png", "./img/air/auto.png", "./img/air/off.png" ]

    let wind_power       = [ "auto", "silent", "1", "2", "3", "4", "powerful" ];
    let wind_power_label = [ "自動", "静か", "弱", "中", "中強", "強", "パワフル" ];

    let wind_dir_v       = [ "auto", "1", "2", "3", "4", "5" ]
    let wind_dir_v_label = [ "自動", "最上", "上", "中央", "下", "最下" ];

    let wind_dir_s       = [ "auto", "1", "2", "3", "4", "5" ];
    let wind_dir_s_label = [ "自動", "最左", "左", "中央", "右", "最右" ];

    var power_val = power.indexOf( config.air[ 0 ]);
    var mode_val = mode.indexOf( config.air[ 1 ]);
    var temp_val = Number( config.air[ 4 ]);
    var wind_power_val = wind_power.indexOf( config.air[ 5 ]);
    var wind_dir_s_val = wind_dir_s.indexOf( config.air[ 6 ]);
    var wind_dir_v_val = wind_dir_v.indexOf( config.air[ 7 ]);

    let data = [ "generate", power[ power_val ], mode[ mode_val ], "none", "", temp_val, wind_power[ wind_power_val ], wind_dir_s[ wind_dir_s_val ], wind_dir_v[ wind_dir_v_val ]];

    $.post( "/api?post=ir_send", `data[]=${ data }`, ( err ) => {
        if( err != "OK" ) throw err;

        $( "#power" ).text( "--" );
        $( "#temp" ).text( "--" );
        $( "#wind_power" ).text( "--" );
        $( "#wind_dir_v" ).text( "--" );
        $( "#wind_dir_s" ).text( "--" );

        if( power_val == 1 ) {
            $( "#power" ).text( power_label[ power_val ]);
            $( "#air_status_img" ).attr( "src", mode_imgs[ 5 ]);

        } else {
            $( "#air_status_img" ).attr( "src", mode_imgs[ mode_val ]);
            $( "#power" ).text( power_label[ power_val ] + "（" + mode_label[ mode_val ] + "）");
            $( "#temp" ).text( temp_val );
            $( "#wind_power" ).text( wind_power_label[ wind_power_val ]);
            $( "#wind_dir_v" ).text( wind_dir_v_label[ wind_dir_v_val ]);
            $( "#wind_dir_s" ).text( wind_dir_s_label[ wind_dir_s_val ]);
        }
    });

    update_remote_ui( );
}

function air_ctrl( ) {
    let hours = new Date( ).getHours( );
    var temp = Number( $( "#monitor_temp" ).text( ));
    var hum  = Number( $( "#monitor_hum"  ).text( ));
    var month = Number( get_date( 0 ).split( "月" )[ 0 ]);

    if( Number.isNaN( temp )  || Number.isNaN( hum )) {
        return
    }

    if( 12 <= month || month <= 1 ) {
        config.air[ 1 ] = "auto";

    } else {
        if( 50 <= hum ) {
            config.air[ 1 ] = "dry";
        } else {
            config.air[ 1 ] = "cool";
        }

        if( 5 <= hours && hours < 7 ) {
            var fcst_temp = Number( $( "#today_temp_max" ).text( ));
            var fcst_pop  = Number( $( "#today_pops > tbody > tr > td:first-child" ).text( ).slice( 0, -1 ));
            config.air[ 0 ] = "on";

            if( 30 <= fcst_temp ) {
                config.air[ 1 ] = "cool";
                config.air[ 4 ] = 26;

            } else if( 70 <= fcst_pop ) {
                config.air[ 1 ] = "dry";
                config.air[ 4 ] = 27;

            } else {
                config.air[ 4 ] = recalc_THI( hum );
            }

        } else {
            config.air[ 4 ] = recalc_THI( hum );
        }
    }
}

function decision_THI( num ) {
    var thi_str = [ "寒くてたまらない", "寒い", "肌寒い", "何も感じない", "快適", "暑くない", "やや暑い", "暑くて汗が出る", "暑くてたまらない" ];
    var index = 0;

    if( 49.99 < num ) {
        index = Math.ceil(( num - 49.99 ) / 5 );

        if( thi_str.length <= index ) {
            index = thi_str.length - 1;
        }
    }

    return [ thi_str[ index ], index ];
}

function decision_WBGT( num ){
    var wbgt_str = [ "注意", "警戒", "厳重警戒", "危険" ];
    var index = 0;

    if( 24.99 < num ){
        index = Math.ceil(( num - 24.99 ) / 5 );

        if( wbgt_str.length <= index ) {
            index = wbgt_str.length - 1;
        }
    }

    return [ wbgt_str[ index ], index ];
}

function update_remote_ui() {
    const is_power_on = config.air[ 0 ] === 'on';

    $( '#remote_power' ).toggleClass( 'active', is_power_on );

    $( '.remote-body button:not(#remote_power)' ).prop( 'disabled', !is_power_on );
    $( '.remote-body .remote-section:not(:first-child)' ).css( 'opacity', is_power_on ? 1 : 0.5 );

    if ( is_power_on ) {
        $( '.mode-btn' ).removeClass( 'active' );
        $( `.mode-btn[ data-mode = "${ config.air[ 1 ]}"]` ).addClass( 'active' );

        $( '#remote_temp_display' ).text( config.air[ 4 ] + '°C' );

        $( '.wind-btn' ).removeClass( 'active' );
        $( `.wind-btn[ data-wind = "${ config.air[ 5 ]}"]` ).addClass( 'active' );

        $( '.wind-dir-s-btn' ).removeClass( 'active' );
        $( `.wind-dir-s-btn[ data-wind-s = "${ config.air[ 6 ]}"]` ).addClass( 'active' );

        $( '.wind-dir-v-btn' ).removeClass( 'active' );
        $( `.wind-dir-v-btn[ data-wind-v = "${ config.air[ 7 ]}"]` ).addClass( 'active' );
    }
}

function initialize_remote_control( ) {
    Promise.all(
        [ get_config ]
    ).then(( ) => {
        update_remote_ui( );
    });

    $( '#remote_power' ).on( 'click', function( ) {
        config.air[ 0 ] = ( config.air[ 0 ] === 'on' ) ? 'off' : 'on';
        update_remote_ui( );
        render_air_info( );
    });

    $( '.mode-btn' ).on( 'click', function( ) {
        config.air[ 1 ] = $( this ).data( 'mode' );
        update_remote_ui( );
    });

    $( '#remote_temp_up' ).on( 'click', function( ) {
        let temp = parseInt( config.air[ 4 ]);
        if ( temp < 30 ) config.air[ 4 ] = temp + 1;
        update_remote_ui( );
    });

    $( '#remote_temp_down' ).on( 'click', function( ) {
        let temp = parseInt( config.air[ 4 ]);
        if ( temp > 16 ) config.air[ 4 ] = temp - 1;
        update_remote_ui( );
    });

    $( '.wind-btn' ).on( 'click', function( ) {
        config.air[ 5 ] = String( $( this ).data( 'wind' ));
        update_remote_ui( );
    });

    $( '.wind-dir-s-btn' ).on( 'click', function( ) {
        config.air[ 6 ] = String( $( this ).data( 'wind-s' ));
        update_remote_ui( );
    });

    $( '.wind-dir-v-btn' ).on( 'click', function( ) {
        config.air[ 7 ] = String( $( this ).data( 'wind-v' ));
        update_remote_ui( );
    });

    $( '#remote_submit' ).on( 'click', function( ) {
        render_air_info( );
    });
}

async function main_loop( ){
    await render_weather( );
    await get_temps( );

    air_ctrl( );

    setTimeout(( ) => {
        render_air_info( );
    }, 5000 );

    setTimeout( main_loop, 30000 );
};
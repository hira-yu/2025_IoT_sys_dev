import sys

def convert_2_time( data ):
    symbol = 70
    t = symbol
    ts = [ ]

    for i in range( 1, len( data )):
        if data[ i ] == "0":
            if data[ i - 1 ] == "0":
                t += symbol
            else:
                ts.append( t )
                t = symbol
        elif data[ i ] == "1":
            if data[ i - 1 ] == "1":
                t += symbol
            else:
                ts.append( t )
                t = symbol

    return ts

def data_normalize( data, T = 425 ):
    normalized = [ ]
    frame = [ ]

    for i in range( len( data )):
        period = round( data[ i ] / T )

        if period == 0:
            period = 1

        if period == 2:
            period = 3

        if period == 4 and frame[ -1 ] == 1:
            period = 3

        if period > 8:
            normalized.append( frame )
            frame = [ ]
        else:
            frame.append( period )

    normalized.append( frame )
    return normalized

def decode_2_binary( data ):
    block = [ ]
    data_frame = ""

    for frame in data:
        for i in range( 0, len( frame ) - 1, 2 ):
            if frame[ i ] == 8 and frame[ i + 1 ] == 4:
                continue

            elif frame[ i ] == 1 and frame[ i + 1 ] == 1:
                data_frame += "0"

            elif frame[ i ] == 1 and frame[ i + 1 ] == 3:
                data_frame += "1"

            else:
                raise ( "Decode Failed" )

        block.append( data_frame )
        data_frame = ""

    return block

def parse_hex( binary ):
    hex_code = ""

    while len( binary ) > 0:
        hex_code += "{:02x}".format( int( binary[ 7 :: -1 ], 2 ))
        binary = binary[ 8: ]

    return hex_code

def encode_2_bin( hex ):
    bin_data = ""

    while len( hex ) > 0:
        byte = "{:08b}".format( int( hex[ :2 ], 16 ))
        bin_data += byte[ ::-1 ]
        hex = hex[ 2: ]

    bin_data += "1"

    return bin_data

def encode_ir_data( format, hex, time ):
    gain = round( time / 70 )

    if format == "AEHA":
        bin_data = encode_2_bin( hex )
        frame = [ "1" * 8 * gain, "0" * 4 * gain ]

        for b in bin_data:
            if b == "0":
                frame.extend([ "1" * gain, "0" * gain ])
            else:
                frame.extend([ "1" * gain, "0" * 3 * gain ])

        return frame

def convert_2_obniz( format, data ):
    if format == "AEHA":
        frame_1 = "".join( encode_ir_data( "AEHA", data[ 0 ], 425 ))
        frame_2 = "".join( encode_ir_data( "AEHA", data[ 1 ], 425 ))

        frame = frame_1 + "0" * 120 + frame_2

        row_data = list( map( lambda x: int( x ), frame ))

        return row_data[ : -17 ]

## https://zenn.dev/mikiken/articles/decode-ir-signal#fn-4cf2-5

def generate_hex( switch, mode, timer_mode, timer, temp, power, wind_dir_s, wind_dir_v ):
    bytes = [ "02", "20", "E0", "04", "00" ]
    byte = ""

    # ====================================
    # 6byte目
    # ====================================

    modes = [
        "01001",    #暖房
        "00111",    #冷房
        "00101",    #除湿・除湿弱
        "00001",    #自動
    ]

    if mode == "heat":
        byte = modes[ 0 ]
    elif mode == "cool":
        byte = modes[ 1 ]
    elif mode == "dry" or mode == "dry_low":
        byte = modes[ 2 ]
    elif mode == "auto":
        byte = modes[ 3 ]

    if timer_mode == "none":
        byte += "00"
    elif timer_mode == "on":
        byte += "01"
    elif timer_mode == "off":
        byte += "10"
    elif timer_mode == "onf":
        byte += "11"

    if switch == "on":
        byte += "1"
    else:
        byte += "0"

    bytes.append( format( int( byte, 2 ), '02x' ) )

    # ====================================
    # 7byte目
    # ====================================

    if temp < 16:
        temp = 16
    if 30 < temp:
        temp = 30

    byte = "001" + format( temp - 16, "04b" ) + "0"
    bytes.append( format( int( byte, 2 ), '02x' ))

    # ====================================
    # 8byte目
    # ====================================

    if mode == "dry_low":
        bytes.append( "7f" )
    else:
        bytes.append( "80" )

    # ====================================
    # 9byte目
    # ====================================

    powers = [
        "0011",     #１・静か
        "0100",     #２
        "0101",     #３
        "0111",     #４
        "1010",     #パワフル・自動
    ]

    wind_dirs_v = [
        "0001",     #１
        "0010",     #２
        "0011",     #３
        "0100",     #４
        "0101",     #５
        "1111",     #自動
    ]

    if power == "1" or power == "silent":
        byte = powers[ 0 ]
    elif power == "2":
        byte = powers[ 1 ]
    elif power == "3":
        byte = powers[ 2 ]
    elif power == "4":
        byte = powers[ 3 ]
    elif power == "powerful" or power == "auto":
        byte = powers[ 4 ]

    if wind_dir_v == "1":
        byte += wind_dirs_v[ 0 ]
    elif wind_dir_v == "2":
        byte += wind_dirs_v[ 1 ]
    elif wind_dir_v == "3":
        byte += wind_dirs_v[ 2 ]
    elif wind_dir_v == "4":
        byte += wind_dirs_v[ 3 ]
    elif wind_dir_v == "5":
        byte += wind_dirs_v[ 4 ]
    elif wind_dir_v == "auto":
        byte += wind_dirs_v[ 5 ]

    bytes.append( format( int( byte, 2 ), '02x' ))

    # ====================================
    # 10byte目
    # ====================================
    wind_dirs_s = [
        "1001",     #１
        "1010",     #２
        "0110",     #３
        "1011",     #４
        "1100",     #５
        "1101",     #自動
    ]

    byte = "0000"

    if wind_dir_s == "1":
        byte += wind_dirs_s[ 0 ]
    elif wind_dir_s == "2":
        byte += wind_dirs_s[ 1 ]
    elif wind_dir_s == "3":
        byte += wind_dirs_s[ 2 ]
    elif wind_dir_s == "4":
        byte += wind_dirs_s[ 3 ]
    elif wind_dir_s == "5":
        byte += wind_dirs_s[ 4 ]
    elif wind_dir_s == "auto":
        byte += wind_dirs_s[ 5 ]

    bytes.append( format( int( byte, 2 ), '02x' ))

    # ====================================
    # 11byte目
    # ====================================

    if timer_mode == "none":
        bytes.append( "00" )
    else:
        bytes.append( "3C" )

    # ====================================
    # 12byte目
    # ====================================

    bytes.append( "0e" )

    # ====================================
    # 13byte目
    # ====================================

    bytes.append( "e0" )

    # ====================================
    # 14byte目
    # ====================================

    if power == "silent":
        byte = "01100000"
    elif power == "powerful":
        byte = "01000001"
    else:
        byte = "01000000"

    bytes.append( format( int( byte, 2 ), '02x' ))

    # ====================================
    # 15byte目
    # ====================================

    byte = "000000"

    if temp == 16 or temp == 30:
        byte += "10"
    else:
        byte += "00"

    bytes.append( format( int( byte, 2 ), '02x' ))

    # ====================================
    # 16byte目
    # ====================================

    bytes.append( "86" )

    # ====================================
    # 17byte目
    # ====================================

    bytes.append( "00" )

    # ====================================
    # 18byte目
    # ====================================

    bytes.append( "84" )

    # ====================================
    # 19byte目
    # ====================================

    checksum = \
        int( bytes[  5 ], 16 ) + \
        int( bytes[  6 ], 16 ) + \
        int( bytes[  7 ], 16 ) + \
        int( bytes[  8 ], 16 ) + \
        int( bytes[  9 ], 16 ) + \
        int( bytes[ 10 ], 16 ) + \
        int( bytes[ 11 ], 16 ) + \
        int( bytes[ 12 ], 16 ) + \
        int( bytes[ 13 ], 16 ) + \
        int( bytes[ 14 ], 16 ) + \
        int( bytes[ 15 ], 16 ) + \
        int( bytes[ 16 ], 16 ) + \
        int( bytes[ 17 ], 16 ) + \
        6

    bytes.append( format( checksum, '02x')[ -2 : ])

    return "".join( bytes )

if __name__ == '__main__':
    input_data = sys.stdin.readline( ).replace( "\n", "" ).split( "," )

    if input_data[ 0 ] == "generate":
        print( convert_2_obniz( "AEHA", [ "0220e00400000006", generate_hex( input_data[ 1 ], input_data[ 2 ], input_data[ 3 ], input_data[ 4 ], int( input_data[ 5 ]), input_data[ 6 ], input_data[ 7 ], input_data[ 8 ])]))

    else:
        data = decode_2_binary( data_normalize( convert_2_time( input_data )))

        print( parse_hex( data[ 0 ]), parse_hex( data[ 1 ]))

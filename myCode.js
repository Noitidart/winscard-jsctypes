Cu.import('resource://gre/modules/ctypes.jsm');
/*var {Cu} = require("chrome");
var{ctypes} = Cu.import("resource://gre/modules/ctypes.jsm", null);*/

var is64bit = ctypes.voidptr_t.size == 4 ? false : true;
var ifdef_UNICODE = true;

var TYPES = {
    ABI: is64bit ? ctypes.default_abi : ctypes.winapi_abi,

    CALLBACK_ABI: is64bit ? ctypes.default_abi : ctypes.stdcall_cabi,
    CHAR: ctypes.char,
    DWORD: ctypes.uint32_t,
    LONG: ctypes.long,
    LPCVOID: ctypes.voidptr_t,
    ULONG_PTR: is64bit ? ctypes.uint64_t : ctypes.unsigned_long,
    WCHAR: ctypes.char16_t,//ctypes.jschar,//
    BYTE: ctypes.unsigned_char //ctypes.uint8_t
};
// advanced types - based on simple types
TYPES.LPSTR = TYPES.CHAR.ptr;
TYPES.LPCSTR = TYPES.CHAR.ptr;
TYPES.LPDWORD = TYPES.DWORD.ptr;
TYPES.LPCWSTR = TYPES.WCHAR.ptr;
TYPES.LPWSTR = TYPES.WCHAR.ptr;
TYPES.SCARDCONTEXT = TYPES.ULONG_PTR;
TYPES.SCARDHANDLE = TYPES.ULONG_PTR;
TYPES.LPBYTE = TYPES.BYTE.ptr;//ctypes.wintypes.BYTE.ptr;//TYPES.LPSTR;//ctypes.create_string_buffer(32);//TYPES.BYTE.ptr;

// advanced advanced types - based on advanced types
TYPES.LPCTSTR = ifdef_UNICODE ? TYPES.LPCWSTR : TYPES.LPCSTR;
TYPES.LPTSTR = ifdef_UNICODE ? TYPES.LPWSTR : TYPES.LPSTR;
TYPES.PSCARDCONTEXT = TYPES.SCARDCONTEXT.ptr;
TYPES.LPSCARDCONTEXT = TYPES.SCARDCONTEXT.ptr;
TYPES.LPSCARDHANDLE = TYPES.SCARDHANDLE.ptr;

var CONST = {
    SCARD_AUTOALLOCATE: TYPES.DWORD('0xffffffff'),
    SCARD_SCOPE_SYSTEM: 2,
    SCARD_SCOPE_USER: 0,
    SCARD_S_SUCCESS: 0,
    SCARD_SHARE_SHARED: 2,
    SCARD_PROTOCOL_T0: 0x00000000,//An asynchronous, character-oriented half-duplex transmission protocol
    SCARD_PROTOCOL_T1: 0x00000001//An asynchronous, block-oriented  half-duplex transmission protocol
    //PROTOCOL:	TYPES.DWORD,
    //pioSendRequest: SCARD_IO_REQUEST
    
};
var SCARD_IO_REQUEST = new ctypes.StructType("myStruct" ,
                       [{"dwProtocol": TYPES.DWORD},
                        {"cbPciLength": TYPES.DWORD}]);

//x = SCARD_IO_REQUEST();
//SCARD_IO_REQUEST.cbPciLength = CONST.SCARD_PROTOCOL_T0;

//SCARD_IO_REQUEST.LPSCARD_IO_REQUEST = SCARD_IO_REQUEST.ptr;
//SCARD_IO_REQUEST pioSendPci = SCARD_PROTOCOL_T0.ptr | SCARD_PROTOCOL_T1.ptr;
//SCARD_IO_REQUEST = {dwProtocol: TYPES.DWORD, cbPciLength: TYPES.DWORD};
//var pioSendPci = SCARD_IO_REQUEST(CONST.SCARD_PROTOCOL_T0|CONST.SCARD_PROTOCOL_T1, );
//var pioSendPci = {dwProtocol: CONST.PROTOCOL, cbPciLength: sizeof(LPCSCARD_IO_REQUEST)};
//CONST.pioSendRequest.dwProtocol = Prtocol;
	//pioSendRequest.cbPciLength = sizeof(SCARD_IO_REQUEST);

var cardLib = ctypes.open('Winscard');
var SCardEstablishContext = cardLib.declare('SCardEstablishContext', TYPES.ABI, TYPES.DWORD, TYPES.DWORD, TYPES.LPCVOID, TYPES.LPCVOID, TYPES.LPSCARDCONTEXT);
var SCardListReaders = cardLib.declare(ifdef_UNICODE ? 'SCardListReadersW' : 'SCardListReadersA', TYPES.ABI, TYPES.LONG, TYPES.SCARDCONTEXT, TYPES.LPCTSTR, TYPES.LPTSTR, TYPES.LPDWORD);
var SCardConnect = cardLib.declare(ifdef_UNICODE ? 'SCardConnectW' : 'SCardConnectA', TYPES.ABI, TYPES.LONG, TYPES.SCARDCONTEXT, TYPES.LPCTSTR, TYPES.DWORD,TYPES.DWORD,TYPES.LPSCARDHANDLE, TYPES.LPDWORD);
var SCardBeginTransaction = cardLib.declare('SCardBeginTransaction', TYPES.ABI, TYPES.LONG, TYPES.SCARDHANDLE);
var SCardStatus = cardLib.declare(ifdef_UNICODE ? 'SCardStatusW' : 'SCardStatusA', TYPES.ABI, TYPES.LONG, TYPES.SCARDHANDLE, TYPES.LPTSTR, TYPES.LPDWORD, TYPES.LPDWORD, TYPES.LPDWORD, TYPES.LPBYTE, TYPES.LPDWORD);
var SCardTransmit = cardLib.declare('SCardTransmit', TYPES.ABI, TYPES.LONG, TYPES.SCARDHANDLE, SCARD_IO_REQUEST.ptr, TYPES.LPBYTE, TYPES.DWORD, SCARD_IO_REQUEST.ptr, TYPES.LPBYTE, TYPES.LPDWORD);
var SCardFreeMemory = cardLib.declare('SCardFreeMemory', TYPES.ABI, TYPES.LONG, TYPES.SCARDCONTEXT, TYPES.LPCVOID);
var SCardReleaseContext = cardLib.declare('SCardReleaseContext', TYPES.ABI, TYPES.LONG, TYPES.SCARDCONTEXT);

// types, consts, and functions declarations complete, now lets use it
try {
    var hSC = TYPES.SCARDCONTEXT();
    var rez_SCEC = SCardEstablishContext(CONST.SCARD_SCOPE_SYSTEM, null, null, hSC.address());
    if (rez_SCEC.toString() != CONST.SCARD_S_SUCCESS.toString()) {
        console.error('failed to establish context! error code was: ' + rez_SCEC + ' in other terms it is: 0x' + rez_SCEC.toString(16) + ' you can look up this error value here: https://msdn.microsoft.com/en-us/library/windows/desktop/aa374738%28v=vs.85%29.aspx#smart_card_return_values');
        throw new Error('failed to establish context!');
    }

    try {
		var reader_count = TYPES.DWORD();				
        var rez_SCLR = SCardListReaders(hSC, null, null, reader_count.address());
        console.log('rez_SCLR:', rez_SCLR, rez_SCLR.toString());
        if (rez_SCLR.toString() != CONST.SCARD_S_SUCCESS.toString()) {
            console.error('failed to get list of readers! error code was: ' + rez_SCLR + ' in other terms it is: 0x' + rez_SCLR.toString(16) + ' you can look up this error value here: https://msdn.microsoft.com/en-us/library/windows/desktop/aa374738%28v=vs.85%29.aspx#smart_card_return_values');
            throw new Error('failed to get list of readers!');
        }

		console.log('parseInt(reader_count.value):', parseInt(reader_count.value));
		
		var reader_names = TYPES.LPTSTR.targetType.array(parseInt(reader_count.value))();
		console.log('reader_names.toString()', reader_names.toString());
		console.log('reader_names.address().toString()', reader_names.address().toString());
		
        var rez_SCLR = SCardListReaders(hSC, null, reader_names, reader_count.address());
        console.log('rez_SCLR:', rez_SCLR, rez_SCLR.toString());
        if (rez_SCLR.toString() != CONST.SCARD_S_SUCCESS.toString()) {
            console.error('failed to get list of readers! error code was: ' + rez_SCLR + ' in other terms it is: 0x' + rez_SCLR.toString(16) + ' you can look up this error value here: https://msdn.microsoft.com/en-us/library/windows/desktop/aa374738%28v=vs.85%29.aspx#smart_card_return_values');
            throw new Error('failed to get list of readers!');
        }
		console.error('reader_names.toString()', reader_names.toString());
		
       var names = "";
       for(i =0; i<reader_names.length; i++)
       {
           names = names + reader_names[i];
       } 
       names = names.replace('\x00\x00','');
       names = names.replace('\x00',';');
       
        
       /* var length = reader_names.toString().length;
        var names = "";
        var flag = false;
        for(i = 0 ; i<length; i++)
            {
                if(reader_names.toString().substring(i,i+1)=="[")
                    flag = true;
                else if(reader_names.toString().substring(i,i+1)=="]")
                   flag = false;
                                  
               if(flag && reader_names.toString().substring(i, i+1) == '"' 
                       && reader_names.toString().substring(i+2, i+3) == '"')
                   {
                        names = names + reader_names.toString().substring(i+1, i+2);
                       i = i + 4;
                   }
               if(flag && reader_names.toString().substring(i+2, i+5) == "x00")
                {
                      names = names + ";";
                    i = i + 5;
                }
            }
        names = names.substring(0,names.length-2);
       
       var splited_names = names.split(";");
		
		console.info('names', splited_names[0]);
        var rrr= splited_names[0];*/
        
	/*	require("sdk/tabs").activeTab.attach({
      contentScript: 'window.alert("' + names + '");'
    });*/
		
        //-------------------------connection------------------------------
       
      //var selectedReader = ctypes.cast(ctypes.char16_t.array()(names), TYPES.LPTSTR);
      //var selectedReader = ctypes.char16_t.array()(names);
      //var selectedReader = reader_names;
      //var selectedReader = TYPES.LPTSTR.targetType.array(parseInt(reader_count.value))(names);
        var selectedReader = TYPES.LPCTSTR (reader_names);
      
      var cardHandle  = TYPES.SCARDHANDLE();			
      var AProtocol = TYPES.DWORD();
      console.info('before connect');
		  var rez_SCC = SCardConnect(hSC, selectedReader , CONST.SCARD_SHARE_SHARED, CONST.SCARD_PROTOCOL_T0|CONST.SCARD_PROTOCOL_T1, cardHandle.address(), AProtocol.address());
      
      console.log('rez_SCC:', rez_SCC, rez_SCC.toString());
      if (rez_SCC.toString() != CONST.SCARD_S_SUCCESS.toString()) {
          console.error('failed to connect to card, error code was: ' + rez_SCC + ' in other terms it is: 0x' + rez_SCC.toString(16) + ' you can look up this error value here: https://msdn.microsoft.com/en-us/library/windows/desktop/aa374738%28v=vs.85%29.aspx#smart_card_return_values');
          throw new Error('failed to connect to card!');
      }
		// console.error('cardhandel.toString()', cardHandle.toString());

//----------------------------SCardStatus------------------------------
     var szReaderName = TYPES.LPCTSTR.array(36)();// (reader_names);
     var pcchReaderLen = TYPES.LPDWORD(36);
     var pdwState = TYPES.LPDWORD;//(0);
     var pdwProtocol = TYPES.LPDWORD;//(1);
     //var pbAtr = TYPES.BYTE.array[32].ptr;
     var pbAtr = TYPES.BYTE.array(parseInt(64))();
		 var pcbAtrLen = TYPES.LPDWORD;//(0);
     		 //var szReaderName, pcchReaderLen, pdwState, pdwProtocol, pbAtr, pcbAtrLen;
     /*var rez_SCS = SCardStatus(cardHandle, szReaderName, pcchReaderLen, pdwState, pdwProtocol,pbAtr , pcbAtrLen);
     if(rez_SCS.toString() != CONST.SCARD_S_SUCCESS.toString())
     {
          console.error('cannot retrieve status of smart card, error code was: ' + rez_SCS + ' in other terms it is: 0x' + rez_SCS.toString(16) + ' you can look up this error value here: https://msdn.microsoft.com/en-us/library/windows/desktop/aa374738%28v=vs.85%29.aspx#smart_card_return_values');
          throw new Error('failed to retrieve status!');
     }*/
//----------------------------SCardBeginTransaction------------------------------
		 var rez_SCBT = SCardBeginTransaction(cardHandle);
     if(rez_SCBT.toString() != CONST.SCARD_S_SUCCESS.toString())
     {
          console.error('cannot begin transaction, error code was: ' + rez_SCBT + ' in other terms it is: 0x' + rez_SCBT.toString(16) + ' you can look up this error value here: https://msdn.microsoft.com/en-us/library/windows/desktop/aa374738%28v=vs.85%29.aspx#smart_card_return_values');
          throw new Error('failed to begin transactio!');
      }//----------------------------transmission------------------------------
       

        var _SCARD_IO_REQUEST = new SCARD_IO_REQUEST;
        _SCARD_IO_REQUEST.dwProtocol = CONST.SCARD_PROTOCOL_T0|CONST.SCARD_PROTOCOL_T1;
        _SCARD_IO_REQUEST.cbPciLength =  _SCARD_IO_REQUEST.dwProtocol.toString().length;  
        var command = TYPES.LPBYTE.targetType.array(42)("0xa4040010a0000000183003010000000000000000");
        
        var commandLength = command.toString().length;
        var response = TYPES.BYTE();
        var responseLength = TYPES.DWORD();
        
        var rez_SCT = SCardTransmit(cardHandle, _SCARD_IO_REQUEST.address(), command, commandLength, null, response.address(), responseLength.address());
        if(rez_SCT.toString() != CONST.SCARD_S_SUCCESS.toString())
        {
          console.error('cannot begin transaction, error code was: ' + rez_SCT + ' in other terms it is: 0x' + rez_SCT.toString(16) + ' you can look up this error value here: https://msdn.microsoft.com/en-us/library/windows/desktop/aa374738%28v=vs.85%29.aspx#smart_card_return_values');
          throw new Error('failed to begin transactio!');
         }
        
		
		 /*console.error('reader_names.address().toString()', reader_names.address().toString());
     var rez_free = SCardFreeMemory(hSC, reader_names);
     console.log('rez_free:', rez_free, rez_free.toString());
     if (rez_free.toString() != CONST.SCARD_S_SUCCESS.toString()) {
         console.error('failed to free the multi-string that lists the card readers! error code was: ' + rez_free + ' in other terms it is: 0x' + rez_free.toString(16) + ' you can look up this error value here: https://msdn.microsoft.com/en-us/library/windows/desktop/aa374738%28v=vs.85%29.aspx#smart_card_return_values');
         throw new Error('failed to free the multi-string that lists the card readers!');
     }*/
    }finally {/*
     var rez_release = SCardReleaseContext(hSC);
     console.log('rez_release:', rez_release, rez_release.toString());
     if (rez_release.toString() != CONST.SCARD_S_SUCCESS.toString()) {
        console.error('failed to release context! error code was: ' + rez_release + ' in other terms it is: 0x' + rez_release.toString(16) + ' you can look up this error value here: https://msdn.microsoft.com/en-us/library/windows/desktop/aa374738%28v=vs.85%29.aspx#smart_card_return_values');
        throw new Error('failed to release context!');
     }*/
  }

} finally {
    cardLib.close();
    console.log('cardLib closed');
}






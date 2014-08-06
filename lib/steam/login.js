
//Used to add a unique get var to all ajax calls, so IE doesn't do stupid caching
var iAjaxCalls = 0;

var iIncorrectLoginFailures = 0;

function HighlightFailure( msg )
{
	var errorDisplay = $('error_display');
	if ( errorDisplay )
	{
		errorDisplay.update( msg );
		errorDisplay.show();
		errorDisplay.style.color = '#ffffff';
				try { 
			new Effect.Morph( 'error_display', { style: 'color: #d0434b' } );
		}
		catch(err) { }
					$J('input:focus').blur();
			}
}


//Refresh the catpcha image 
function RefreshCaptcha()
{
	++iAjaxCalls;
	
		new Ajax.Request('https://steamcommunity.com/actions/RefreshCaptcha/',
	  {
	    method:'get',
	    parameters: { count : iAjaxCalls },
	    onSuccess: function(transport){
	      if ( transport.responseText ){
	        
	        try {
	      	  var result = transport.responseText.evalJSON(true);
	      	} catch ( e ) {
			  //alert(e);
	      	  return;
	      	}
	      	
	      	gid = result.gid;
	      	UpdateCaptcha( gid );
		  }
	    }
	  });
}

function UpdateCaptcha( gid )
{
	if ( gid != -1 ) 
	{
		$('captcha_entry').show();
		$('captchaImg').src = 'https://steamcommunity.com/public/captcha.php?gid='+gid;
					$('input_captcha').value="saisissez les caractères ci-dessus";
			$('input_captcha').addClassName( 'defaultText' );
			}
	$('captchagid').value = gid;
}

var g_bLoginInFlight = false;
var g_bInEmailAuthProcess = false;
var g_bInTwoFactorAuthProcess = false;
var g_bEmailAuthSuccessful = false;
var g_bLoginTransferInProgress = false;
var g_bEmailAuthSuccessfulWantToLeave = false;
var g_bTwoFactorAuthSuccessful = false;
var g_bTwoFactorAuthSuccessfulWantToLeave = false;
var g_sOAuthRedirectURI = 'steammobile://mobileloginsucceeded';
var g_sAuthCode = "";

function DoLogin()
{
	var form = document.forms['logon'];

	var username = form.elements['username'].value;
	username = username.replace( /[^\x00-\x7F]/g, '' ); // remove non-standard-ASCII characters
	
	var password = form.elements['password'].value;
	password = password.replace( /[^\x00-\x7F]/g, '' ); // remove non-standard-ASCII characters

	if ( g_bLoginInFlight || password.length == 0 || username.length == 0 )
		return;

	g_bLoginInFlight = true;
	$('login_btn_signin').hide();
	$('login_btn_wait').show();
			var errorDisplay = $('error_display');
		if ( errorDisplay )
			errorDisplay.hide();
		if ( $('emailauth').value == "entrez votre code ici" )
		{
			$('emailauth').value = '';
			$('emailauth').removeClassName( 'defaultText' );
		}
	
	new Ajax.Request( 'https://steamcommunity.com/mobilelogin/getrsakey/',
		{
			method: 'post',
			parameters: {
				username: username,
				donotcache: ( new Date().getTime() )
			},
			onSuccess: OnRSAKeyResponse,
			onException: function( req, e ) {
				throw e;
			}
		}
	);
}


function getAuthCode( results )
{
	
				return $('twofactorcode_entry').value;

	}

function OnRSAKeyResponse( transport )
{
	var results = transport.responseJSON;
	if ( results.publickey_mod && results.publickey_exp && results.timestamp )
	{
		var form = document.forms['logon'];

		var pubKey = RSA.getPublicKey( results.publickey_mod, results.publickey_exp );
		var username = form.elements['username'].value;
		username = username.replace( /[^\x00-\x7F]/g, '' ); // remove non-standard-ASCII characters
		var password = form.elements['password'].value;
		password = password.replace( /[^\x00-\x7F]/g, '' ); // remove non-standard-ASCII characters
		var encryptedPassword = RSA.encrypt( password, pubKey );

		new Ajax.Request( 'https://steamcommunity.com/mobilelogin/dologin/',
			{
				method: 'post',
				parameters: {
					password: encryptedPassword,
					username: username,
					twofactorcode: getAuthCode( results ),
					emailauth: form.elements['emailauth'].value,
					loginfriendlyname: form.elements['loginfriendlyname'].value,
										oauth_client_id: form.elements['oauth_client_id'].value,
										captchagid: form.elements['captchagid'].value,
					captcha_text: form.elements['captcha_text'].value,
					emailsteamid: form.elements['emailsteamid'].value,
					rsatimestamp: results.timestamp,
					remember_login: ( form.elements['remember_login'] && form.elements['remember_login'].checked ) ? 'true' : 'false',
					donotcache: ( new Date().getTime() )
				},
				onSuccess: OnLoginResponse,
				onException: function( req, e ) {
							throw e;
						}
			}
		);
	}
	else
	{
		if ( results.message )
		{
			HighlightFailure( results.message );
		}

		$('login_btn_signin').show();
		$('login_btn_wait').hide();

		g_bLoginInFlight = false;
	}
}

function OnLoginResponse( transport )
{
	var results = transport.responseJSON;
	g_bLoginInFlight = false;
	var bRetry = true;

	if ( results.login_complete )
	{
				if ( results.oauth )
		{
			if( results.redirect_uri )
			{
				g_sOAuthRedirectURI = results.redirect_uri;
			}

			document.forms['logon'].elements['oauth'].value = results.oauth;
			bRetry = false;
			LoginComplete();
			return;
		}
		
		var bRunningTransfer = false;
		if ( results.transfer_url && results.transfer_parameters )
		{
			bRunningTransfer = true;
			TransferLogin( results.transfer_url, results.transfer_parameters );
		}
		
		if ( g_bInEmailAuthProcess )
		{
			g_bEmailAuthSuccessful = true;
			SetEmailAuthModalState( 'success' );
		}
		else if ( g_bInTwoFactorAuthProcess )
		{
			g_bTwoFactorAuthSuccessful = true;
			SetTwoFactorAuthModalState( 'success' );
		}
		else
		{
			bRetry = false;
			if ( !bRunningTransfer )
				LoginComplete();
		}
	}
	else
	{
		if ( results.requires_twofactor )
		{
			$('captcha_entry').hide();

			if ( !g_bInTwoFactorAuthProcess )
				StartTwoFactorAuthProcess();
			else
				SetTwoFactorAuthModalState( 'incorrectcode' );
		}
		else if ( results.captcha_needed && results.captcha_gid )
		{
			UpdateCaptcha( results.captcha_gid );
			iIncorrectLoginFailures ++;
		}
		else if ( results.emailauth_needed )
		{
			if ( results.emaildomain )
				$('emailauth_entercode_emaildomain').update( results.emaildomain );
			
			if ( results.emailsteamid )
				$('emailsteamid').value = results.emailsteamid;
			
			if ( !g_bInEmailAuthProcess )
				StartEmailAuthProcess();
			else
				SetEmailAuthModalState( 'incorrectcode' );
		}
		else if ( results.denied_ipt )
		{
			$('loginIPTModal').OnModalDismissal = ClearLoginForm;
			showModal( 'loginIPTModal' );
		}
		else
		{
		    iIncorrectLoginFailures ++;
		}
		
		if ( results.message )
		{
			HighlightFailure( results.message );
						if ( iIncorrectLoginFailures > 1 && !results.emailauth_needed && !results.bad_captcha )
			{
				// 2 failed logins not due to Steamguard or captcha, un-obfuscate the password field
				$( 'passwordclearlabel' ).show();
				$( 'steamPassword' ).value = '';
				$( 'steamPassword' ).writeAttribute( 'type', 'text' );
			}
					}
	}
	if ( bRetry )
	{
		$('login_btn_signin').show();
		$('login_btn_wait').hide();
	}
}

function ClearLoginForm()
{
	var rgElements = document.forms['logon'].elements;
	rgElements['username'].value = '';
	rgElements['password'].value = '';
	rgElements['emailauth'].value = '';
	rgElements['emailsteamid'].value = '';
	$('authcode').value = '';
	
	if ( rgElements['captchagid'].value )
		RefreshCaptcha();
	
	rgElements['username'].focus();
}

function StartEmailAuthProcess()
{
	g_bInEmailAuthProcess = true;

	SetEmailAuthModalState( 'entercode' );
	
	}

function CancelEmailAuthProcess()
{
	g_bInEmailAuthProcess = false;
	// if the user closed the auth window on the last step, just redirect them like we normally would
	if ( g_bEmailAuthSuccessful )
		LoginComplete();
	else
		ClearLoginForm();
}

function TransferLogin( url, parameters )
{
	if ( g_bLoginTransferInProgress )
		return;
	g_bLoginTransferInProgress = true;

		var iframeElement = document.createElement( 'iframe' );
	iframeElement.id = 'transfer_iframe';
	var iframe = $( iframeElement );
	iframe.hide();
	$(document.body).appendChild( iframe );
	
	var doc = iframe.contentWindow.document;
	doc.open();
	doc.write( '<form method="POST" action="' + url + '" name="transfer_form">' );
	for ( var param in parameters )
	{
		doc.write( '<input type="hidden" name="' + param + '" value="' + parameters[param] + '">' );
	}
	doc.write( '</form>' );
	doc.write( '<script>window.onload = function(){ document.forms["transfer_form"].submit(); }</script>' );
	doc.close();
	
	// firefox fires the onload event twice
	var cLoadCount = Prototype.Browser.Gecko ? 2 : 1;
	
	Event.observe( iframe, 'load', function( event ) { if ( --cLoadCount == 0 ) OnTransferComplete() } );
	Event.observe( iframe, 'error', function( event ) { OnTransferComplete(); } );
	
	// after 10 seconds, give up on waiting for transfer
	window.setTimeout( OnTransferComplete, 10000 );
}

function OnTransferComplete()
{
	if ( !g_bLoginTransferInProgress )
		return;
	g_bLoginTransferInProgress = false;
	if ( !g_bInEmailAuthProcess && !g_bInTwoFactorAuthProcess )
		LoginComplete();
	else if ( g_bEmailAuthSuccessfulWantToLeave || g_bTwoFactorAuthSuccessfulWantToLeave)
		LoginComplete();
}

function OnEmailAuthSuccessContinue()
{
	if ( g_bLoginTransferInProgress )
	{
						
		g_bEmailAuthSuccessfulWantToLeave = true;
	}
	else
		LoginComplete();
}

function LoginComplete()
{
		if ( $('openidForm') )
	{
		$('openidForm').submit();
	}
	else
	{
					if ( document.forms['logon'].elements['oauth'] && ( document.forms['logon'].elements['oauth'].value.length > 0 ) )
			{
				window.location = g_sOAuthRedirectURI + '?' + document.forms['logon'].elements['oauth'].value;
			}
			else
					{
			window.location = document.forms['logon'].elements['redir'].value;
		}
	}
}

function SubmitAuthCode( defaultFriendlyNameText )
{
	var friendlyname =  $('friendlyname').value;
	$('auth_details_computer_name').style.color='#85847f';
	if ( friendlyname != defaultFriendlyNameText && friendlyname.length >= 6 )
	{
		$('auth_buttonsets').childElements().invoke('hide');
		if ( $('auth_buttonset_waiting') )
			$('auth_buttonset_waiting').show();

				DoLogin();
	}
	else{
		$('auth_details_computer_name').style.color='#ff0000';
	}
}

function SetEmailAuthModalState( step )
{
		
		if ( step == 'entercode' )
		{
			$('emailauth').show();
			$('emailauthlabel').show();
			if ( $('emailauth').value == '' )
			{
				$('emailauth').value = 'entrez votre code ici';
				$('emailauth').addClassName( 'defaultText' );
			}
		}
		else if ( step == 'success' )
		{
			OnEmailAuthSuccessContinue();
		}

	}

function OnAuthcodeFocus( defaultText )
{
	if ( $('authcode').value == defaultText )
	{
		$('authcode').value = '';
		$('authcode').removeClassName( 'defaulttext' );
	}
}

function OnAuthcodeBlur( defaultText )
{
	if ( $('authcode').value == '' )
	{
		$('authcode').value = defaultText;
		$('authcode').addClassName( 'defaulttext' );
	}
}

function OnFriendlyNameFocus( defaultText ) 
{ 
    if ( $('friendlyname').value == defaultText ) 
    { 
        $('friendlyname').value = ''; 
        $('friendlyname').removeClassName( 'defaulttext' ); 
    } 
} 
  
function OnFriendlyNameBlur( defaultText ) 
{ 
    if ( $('friendlyname').value == '' ) 
    { 
        $('friendlyname').value = defaultText; 
        $('friendlyname').addClassName( 'defaulttext' ); 
    } 
} 


function StartTwoFactorAuthProcess()
{
	g_bInTwoFactorAuthProcess = true;
	SetTwoFactorAuthModalState( 'entercode' );

	}


function CancelTwoFactorAuthProcess()
{
	g_bInTwoFactorAuthProcess = false;

	if ( g_bEmailAuthSuccessful )
		LoginComplete();
	else
		ClearLoginForm();
}


function OnTwoFactorAuthSuccessContinue()
{
	if ( g_bLoginTransferInProgress )
	{
		
		g_bTwoFactorAuthSuccessfulWantToLeave = true;
	}
	else
		LoginComplete();
}

function SetTwoFactorAuthModalState( step )
{
	
	// mobile, just show the field
	if ( step == 'entercode' )
	{
		$('twofactorcode_entry').show();
		$('twofactorauthlabel').show();
		if ( $('twofactorcode_entry').value == '' )
		{
			$('twofactorcode_entry').value = 'enter your code here';
			$('twofactorcode_entry').addClassName( 'defaultText' );
		}
	}
	else if ( step == 'success' )
	{
		OnTwoFactorAuthSuccessContinue();
	}

	}

function SubmitTwoFactorCode( )
{
	g_sAuthCode = $('twofactorcode_entry').value;

		
	$('login_twofactorauth_messages').childElements().invoke('hide');
	$('login_twofactorauth_details_messages').childElements().invoke('hide');

	$('login_twofactorauth_buttonsets').childElements().invoke('hide');
	if ( $('login_twofactorauth_buttonset_waiting') )
	{
		$('login_twofactorauth_buttonset_waiting').show();
	}

	DoLogin();
}

function OnTwoFactorCodeFocus( defaultText )
{
	if ( $('twofactorcode_entry').value == defaultText )
	{
		$('twofactorcode_entry').value = '';
		$('twofactorcode_entry').removeClassName( 'defaulttext' );
	}
}

function OnTwoFactorCodeBlur( defaultText )
{
}


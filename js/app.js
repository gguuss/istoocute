/*
 * Copyright (c) 2013 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */
var helper = (function() {
  return {
    clientId :'YOUR_CLIENT_ID',
    BASE_API_PATH: 'plus/v1/',
    apiBase: '/api',
    authResult: '',
    user: '',
    mode: 'good',

    /**
     * Hides the sign in button and starts the post-authorization operations.
     *
     * @param {Object} authResult An Object which contains the access token and
     *   other authentication information.
     */
    onSigninCallback: function(authResult) {
        if (authResult['access_token']) {
          console.log("Result from sign-in:");
          console.log(authResult);

          // Setup the base url for API calls
          helper.authResult = authResult;

          // Success.
          // Hide the sign-in button
          $('#gConnect').hide();

          // Reflect the user profile
          gapi.client.load('plus','v1', function(){
            helper.connect();
          });

          helper.mode = document.URL.substring(document.URL.indexOf('#') + 1);
          if (helper.mode.indexOf('/') > 0){
            helper.mode = 'good';
          }

        } else if (authResult['error']) {
          // You can handle various error conditions here
        }
    },

    /**
     * Calls the /api/connect endpoint to connect the user with the server.
     *
     * @param {Object} token An Object which contains the access token and
     *   other authentication information.
     */
    connect: function(){
      gapi.client.plus.people.get({userId:'me'}).execute(
        function(result) {
          helper.user = result;
          $('#profileArea').hide();
          $('#cuteMessage').hide();

          if (helper.mode == 'good'){
            $('#profileArea').html('Signed in as ' + helper.user.displayName + '!')
          }else{
            var html = helper.getProfileHTML(result);
            $('#profileArea').html(html);
          }

          if (helper.mode == 'good' || helper.mode == 'better'){
            $('#profileArea').css('margin-top', '0px');
            $('#profileArea').show();
          }
          if (helper.mode == 'awesome'){
            $('#profileArea').css('margin-top', '0px');
            $('#profileArea' ).show();
            $('#profileArea' ).effect( 'bounce', null, 500, null);
          }
          setTimeout("$('#disconnect').show()", 600);

          $('#authButtons').show();
        }
      );
    },

    /**
     * Gets HTML markup representing a user's profile
     *
     * @param {Object} The user object.
     */
    getProfileHTML: function(user){
      var html = '<table><td><a target="_blank" href="' + user.url + '">' + '<img src="' +
          user.image.url + '" alt="' + user.displayName + '" title="' +
          user.displayName + '" height="35" />' + '</a></td><td>' + 'Signed in' +
          ' as:<br>' + user.displayName + '</td></tr></table>';
      return html;
    },

    /**
     * Shows the modal for disconnecting an account.
     */
    showDisconnectDialog : function() {
      $( "#disconnectDialog" ).dialog({
        modal: true,
        buttons: {
          Disconnect: function(){
            helper.disconnect();
            $( this ).dialog( "close" );
          },
          Cancel: function(){
            $( this ).dialog( "close" );
          }
        }
      });
    },

    /**
     * Calls the OAuth2 endpoint to disconnect the app for the user.
     */
    disconnect: function() {
      // Revoke the access token.
      $.ajax({
        type: 'GET',
        url: 'https://accounts.google.com/o/oauth2/revoke?token=' +
            gapi.auth.getToken().access_token,
        async: false,
        contentType: 'application/json',
        dataType: 'jsonp',
        success: function(result) {
          console.log('revoke response: ' + result);
          $('#authOps').hide();
          $('#profileArea').empty();          
          $('#authResult').empty();
          $('#authButtons').hide();

          $('#cuteMessage').show("slide", null, 250, null);
          $('#gConnect').show();
        },
        error: function(e) {
          console.log(e);
        }
      });
    }
  };
})();
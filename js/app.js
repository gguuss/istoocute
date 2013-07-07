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
    isInAuth: false,
    user: '',
    mode: 'good',
    imageUrls: new Array(),
    authScopes: 'https://www.googleapis.com/auth/plus.login',

  /**
    * Initializes the helper module attributes such as the demo mode and
    * root url.
    */
    initialize: function(){
      helper.getMode();
      if (helper.mode != 'awesome' || helper.isEnrolled()){
        helper.renderSignin('itcsignin');
      }else{
      }
    },

    /**
     * Hides the sign in button and starts the post-authorization operations.
     *
     * @param {Object} authResult An Object which contains the access token and
     *   other authentication information.
     */
    onSigninCallback: function(authResult) {
      if (authResult['access_token']) {
        console.log('Result from sign-in:');
        console.log(authResult);

        // Setup the base url for API calls
        helper.authResult = authResult;

        // Reflect the user's profile
        gapi.client.load('plus','v1', function(){
          helper.connect();
        });

        // Success.
        // Hide the sign-in button
        $('#gConnect').hide();
        helper.dialogSigninClick();
      } else if (authResult['error']) {
        // You can handle various error conditions here
        if (authResult['error'] == 'access_denied'){
          // The user cancelled out of the dialog.
          if (helper.mode == 'awesome'){
            $('#itcsigninContainer').empty();
            $('#itcsigninContainer').html('<span id="itcsigninDialog"></span>')
            $('#pre-render').show();
          }
        }
      }
    },

    /**
     * Retrieves the anchor name to set the mode for the demo.
     */
    getMode: function(){
      helper.mode = document.URL.substring(document.URL.indexOf('#') + 1);
      if (helper.mode.indexOf('/') > 0){
        helper.mode = 'good';
      }
    },

    /**
     * Renders the Google+ Sign-In button with the scopes set in the helper module.
     */
    renderSignin: function(target){
      $('#pre-render').hide();

      if (helper.mode == 'better'){
        helper.authScopes += ' https://www.googleapis.com/auth/drive.readonly';
      }

      gapi.signin.render(target, {
        clientid: helper.clientId,
        cookiepolicy: 'single_host_origin',
        scope: helper.authScopes,
        callback: onSigninCallback
      });
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
          helper.enroll();
          helper.user = result;
          $('#profileArea').hide();
          $('#cuteMessage').hide();

          var html = helper.getProfileHTML(result);
          $('#profileArea').html(html);

          $('#profileArea').css('margin-top', '0px');
          $('#profileArea').show();
          $('#profileArea').effect( 'bounce', null, 500, null);

          setTimeout("$('#disconnect').show()", 600);
          setTimeout("$('#camera').show()", 600);
          helper.findPhotos();

          $('#authButtons').show();
        }
      );
   },

   /**
    * Finds photos in Google+ and Google Drive.
    */
    findPhotos: function(){
      helper.findPlusPhotos();
      helper.findDrivePhotos();
    },

   /**
    * Finds photos in a user's Google+ activities.
    */
    findPlusPhotos: function(){
      var request = gapi.client.plus.activities.list({
        'userId' : 'me',
        'collection' : 'public',
        'maxResults' : 100
      });

      request.execute(function(resp) {
        var numItems = resp.items.length;
        for (var i = 0; i < numItems; i++) {
          var attachments = resp.items[i].object.attachments;
          if (attachments != undefined){
            for( var j = 0; j < attachments.length; j++){
              if (attachments[j].image != undefined){
                helper.imageUrls.push(attachments[j].image.url);
              }
            }
          }
        }
        console.log('After Google+, you now have: ' +
          helper.imageUrls.length + ' files');
      });
    },

   /**
    * findDrivePhotos Finds photos from Google Drive.
    */
    findDrivePhotos: function(){
      var authConfig = {
        'client_id': helper.clientId,
        'scope': helper.authScopes,
        'immediate': true
      };
      gapi.client.load('drive', 'v2', function(){
        gapi.auth.authorize(authConfig, function(resp){
          gapi.client.drive.files.list({'q':'mimeType = "image/png"'}).execute(
            function(resp){
              for(var i=0; i<resp.items.length; i++){
                var driveFile = resp.items[i];
                helper.imageUrls.push(driveFile.webContentLink);
              }
              console.log('With Google Drive, you now have: ' +
                helper.imageUrls.length + ' files');
            });
        });
      });
    },

   /**
    * renderPhotos Renders the current list of images from Google.
    */
    renderPhotos : function(){
      var photosHtml = "";
      for (var i=0; i<helper.imageUrls.length; i++){
        photosHtml += '<img width=50 src="' + helper.imageUrls[i] + '"></img>';
        $('#photosArea').contents().find('html').html(photosHtml);

        $('#photos').dialog({width:500});
      }
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
      $('#disconnectDialog').dialog({
        modal: true,
        buttons: {
          Disconnect: function(){
            helper.disconnect();
            $(this).dialog('close');
          },
          Cancel: function(){
            $(this).dialog('close');
          }
        }
      });

    },

    /**
     * Shows the modal for disconnecting an account.
     */
    showScopesDialog : function() {
      helper.authScopes = 'https://www.googleapis.com/auth/plus.login';
      $('#showScopesDialog').dialog({
        close: helper.signinDialogClose,
        modal: true,
        width: 440,
        buttons: {
          'Google Drive and Google+': function(){
            helper.authScopes += ' https://www.googleapis.com/auth/drive.readonly';
            helper.renderSignin(itcsigninDialog);
          },
          'Only Google+': function(){
            helper.renderSignin(itcsigninDialog);
          }
        }
      });
    },

   /**
    * Handles UI when the user clicks the Google+ Sign-In button from the
    * chooser dialog.
    */
    dialogSigninClick: function(){
        helper.isInAuth = true;
        try{
          $('#showScopesDialog').dialog('close');
        }catch(e){
          if (e.toString().indexOf('prior to initialization')){
            // If the dialog is already closed or does not exist, ignore.
          }else{
            throw(e);
          }
        }
    },

   /*
    * Renders the pre-click button and resets the scopes in the sign in dialog
    * HTML.
    */
    signinDialogClose: function(){
      if (helper.mode == 'awesome'){
        $('#itcsigninContainer').empty();
        $('#itcsigninContainer').html('<span id="itcsigninDialog"></span>')

        if (!helper.isInAuth){
          $('#pre-render').show();
        }
      }
    },

   /**
    * Tests whether the user is an in enrolled state.
    */
    isEnrolled: function(){
      return (document.cookie != undefined &&
        document.cookie.indexOf('enrolled=1') > -1);
    },

   /**
    * Remove the enrolled state when the user disconnects.
    */
    unenroll: function(){
      document.cookie = 'enrolled=0';
    },

   /**
    * Simulate an enrolled state for the user when they sign in.
    */
    enroll: function(){
      document.cookie = 'enrolled=1;expires=0';
    },

    /**
     * Calls the OAuth2 endpoint to disconnect the app for the user.
     */
    disconnect: function() {
      helper.unenroll();

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

          $('#cuteMessage').show('slide', null, 250, null);
          $('#gConnect').show();
        },
        error: function(e) {
          console.log(e);
        }
      });
    }
  };
})();

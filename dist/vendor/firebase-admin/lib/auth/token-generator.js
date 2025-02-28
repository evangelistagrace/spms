/*! firebase-admin v9.5.0 */
"use strict";
/*!
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseTokenGenerator = exports.cryptoSignerFromApp = exports.EmulatedSigner = exports.IAMSigner = exports.ServiceAccountSigner = exports.BLACKLISTED_CLAIMS = void 0;
var credential_internal_1 = require("../credential/credential-internal");
var error_1 = require("../utils/error");
var api_request_1 = require("../utils/api-request");
var validator = require("../utils/validator");
var utils_1 = require("../utils");
var ALGORITHM_RS256 = 'RS256';
var ALGORITHM_NONE = 'none';
var ONE_HOUR_IN_SECONDS = 60 * 60;
// List of blacklisted claims which cannot be provided when creating a custom token
exports.BLACKLISTED_CLAIMS = [
    'acr', 'amr', 'at_hash', 'aud', 'auth_time', 'azp', 'cnf', 'c_hash', 'exp', 'iat', 'iss', 'jti',
    'nbf', 'nonce',
];
// Audience to use for Firebase Auth Custom tokens
var FIREBASE_AUDIENCE = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
/**
 * A CryptoSigner implementation that uses an explicitly specified service account private key to
 * sign data. Performs all operations locally, and does not make any RPC calls.
 */
var ServiceAccountSigner = /** @class */ (function () {
    /**
     * Creates a new CryptoSigner instance from the given service account credential.
     *
     * @param {ServiceAccountCredential} credential A service account credential.
     */
    function ServiceAccountSigner(credential) {
        this.credential = credential;
        this.algorithm = ALGORITHM_RS256;
        if (!credential) {
            throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INVALID_CREDENTIAL, 'INTERNAL ASSERT: Must provide a service account credential to initialize ServiceAccountSigner.');
        }
    }
    /**
     * @inheritDoc
     */
    ServiceAccountSigner.prototype.sign = function (buffer) {
        var crypto = require('crypto'); // eslint-disable-line @typescript-eslint/no-var-requires
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(buffer);
        return Promise.resolve(sign.sign(this.credential.privateKey));
    };
    /**
     * @inheritDoc
     */
    ServiceAccountSigner.prototype.getAccountId = function () {
        return Promise.resolve(this.credential.clientEmail);
    };
    return ServiceAccountSigner;
}());
exports.ServiceAccountSigner = ServiceAccountSigner;
/**
 * A CryptoSigner implementation that uses the remote IAM service to sign data. If initialized without
 * a service account ID, attempts to discover a service account ID by consulting the local Metadata
 * service. This will succeed in managed environments like Google Cloud Functions and App Engine.
 *
 * @see https://cloud.google.com/iam/reference/rest/v1/projects.serviceAccounts/signBlob
 * @see https://cloud.google.com/compute/docs/storing-retrieving-metadata
 */
var IAMSigner = /** @class */ (function () {
    function IAMSigner(httpClient, serviceAccountId) {
        this.algorithm = ALGORITHM_RS256;
        if (!httpClient) {
            throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INVALID_ARGUMENT, 'INTERNAL ASSERT: Must provide a HTTP client to initialize IAMSigner.');
        }
        if (typeof serviceAccountId !== 'undefined' && !validator.isNonEmptyString(serviceAccountId)) {
            throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INVALID_ARGUMENT, 'INTERNAL ASSERT: Service account ID must be undefined or a non-empty string.');
        }
        this.httpClient = httpClient;
        this.serviceAccountId = serviceAccountId;
    }
    /**
     * @inheritDoc
     */
    IAMSigner.prototype.sign = function (buffer) {
        var _this = this;
        return this.getAccountId().then(function (serviceAccount) {
            var request = {
                method: 'POST',
                url: "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" + serviceAccount + ":signBlob",
                data: { payload: buffer.toString('base64') },
            };
            return _this.httpClient.send(request);
        }).then(function (response) {
            // Response from IAM is base64 encoded. Decode it into a buffer and return.
            return Buffer.from(response.data.signedBlob, 'base64');
        }).catch(function (err) {
            if (err instanceof api_request_1.HttpError) {
                var error = err.response.data;
                if (validator.isNonNullObject(error) && error.error) {
                    var errorCode = error.error.status;
                    var description = 'Please refer to https://firebase.google.com/docs/auth/admin/create-custom-tokens ' +
                        'for more details on how to use and troubleshoot this feature.';
                    var errorMsg = error.error.message + "; " + description;
                    throw error_1.FirebaseAuthError.fromServerError(errorCode, errorMsg, error);
                }
                throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INTERNAL_ERROR, 'Error returned from server: ' + error + '. Additionally, an ' +
                    'internal error occurred while attempting to extract the ' +
                    'errorcode from the error.');
            }
            throw err;
        });
    };
    /**
     * @inheritDoc
     */
    IAMSigner.prototype.getAccountId = function () {
        var _this = this;
        if (validator.isNonEmptyString(this.serviceAccountId)) {
            return Promise.resolve(this.serviceAccountId);
        }
        var request = {
            method: 'GET',
            url: 'http://metadata/computeMetadata/v1/instance/service-accounts/default/email',
            headers: {
                'Metadata-Flavor': 'Google',
            },
        };
        var client = new api_request_1.HttpClient();
        return client.send(request).then(function (response) {
            if (!response.text) {
                throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INTERNAL_ERROR, 'HTTP Response missing payload');
            }
            _this.serviceAccountId = response.text;
            return response.text;
        }).catch(function (err) {
            throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INVALID_CREDENTIAL, 'Failed to determine service account. Make sure to initialize ' +
                'the SDK with a service account credential. Alternatively specify a service ' +
                ("account with iam.serviceAccounts.signBlob permission. Original error: " + err));
        });
    };
    return IAMSigner;
}());
exports.IAMSigner = IAMSigner;
/**
 * A CryptoSigner implementation that is used when communicating with the Auth emulator.
 * It produces unsigned tokens.
 */
var EmulatedSigner = /** @class */ (function () {
    function EmulatedSigner() {
        this.algorithm = ALGORITHM_NONE;
    }
    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    EmulatedSigner.prototype.sign = function (buffer) {
        return Promise.resolve(Buffer.from(''));
    };
    /**
     * @inheritDoc
     */
    EmulatedSigner.prototype.getAccountId = function () {
        return Promise.resolve('firebase-auth-emulator@example.com');
    };
    return EmulatedSigner;
}());
exports.EmulatedSigner = EmulatedSigner;
/**
 * Create a new CryptoSigner instance for the given app. If the app has been initialized with a service
 * account credential, creates a ServiceAccountSigner. Otherwise creates an IAMSigner.
 *
 * @param {FirebaseApp} app A FirebaseApp instance.
 * @return {CryptoSigner} A CryptoSigner instance.
 */
function cryptoSignerFromApp(app) {
    var credential = app.options.credential;
    if (credential instanceof credential_internal_1.ServiceAccountCredential) {
        return new ServiceAccountSigner(credential);
    }
    return new IAMSigner(new api_request_1.AuthorizedHttpClient(app), app.options.serviceAccountId);
}
exports.cryptoSignerFromApp = cryptoSignerFromApp;
/**
 * Class for generating different types of Firebase Auth tokens (JWTs).
 */
var FirebaseTokenGenerator = /** @class */ (function () {
    /**
     * @param tenantId The tenant ID to use for the generated Firebase Auth
     *     Custom token. If absent, then no tenant ID claim will be set in the
     *     resulting JWT.
     */
    function FirebaseTokenGenerator(signer, tenantId) {
        this.tenantId = tenantId;
        if (!validator.isNonNullObject(signer)) {
            throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INVALID_CREDENTIAL, 'INTERNAL ASSERT: Must provide a CryptoSigner to use FirebaseTokenGenerator.');
        }
        if (typeof this.tenantId !== 'undefined' && !validator.isNonEmptyString(this.tenantId)) {
            throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INVALID_ARGUMENT, '`tenantId` argument must be a non-empty string.');
        }
        this.signer = signer;
    }
    /**
     * Creates a new Firebase Auth Custom token.
     *
     * @param uid The user ID to use for the generated Firebase Auth Custom token.
     * @param developerClaims Optional developer claims to include in the generated Firebase
     *     Auth Custom token.
     * @return A Promise fulfilled with a Firebase Auth Custom token signed with a
     *     service account key and containing the provided payload.
     */
    FirebaseTokenGenerator.prototype.createCustomToken = function (uid, developerClaims) {
        var _this = this;
        var errorMessage;
        if (!validator.isNonEmptyString(uid)) {
            errorMessage = '`uid` argument must be a non-empty string uid.';
        }
        else if (uid.length > 128) {
            errorMessage = '`uid` argument must a uid with less than or equal to 128 characters.';
        }
        else if (!this.isDeveloperClaimsValid_(developerClaims)) {
            errorMessage = '`developerClaims` argument must be a valid, non-null object containing the developer claims.';
        }
        if (errorMessage) {
            throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INVALID_ARGUMENT, errorMessage);
        }
        var claims = {};
        if (typeof developerClaims !== 'undefined') {
            for (var key in developerClaims) {
                /* istanbul ignore else */
                if (Object.prototype.hasOwnProperty.call(developerClaims, key)) {
                    if (exports.BLACKLISTED_CLAIMS.indexOf(key) !== -1) {
                        throw new error_1.FirebaseAuthError(error_1.AuthClientErrorCode.INVALID_ARGUMENT, "Developer claim \"" + key + "\" is reserved and cannot be specified.");
                    }
                    claims[key] = developerClaims[key];
                }
            }
        }
        return this.signer.getAccountId().then(function (account) {
            var header = {
                alg: _this.signer.algorithm,
                typ: 'JWT',
            };
            var iat = Math.floor(Date.now() / 1000);
            var body = {
                aud: FIREBASE_AUDIENCE,
                iat: iat,
                exp: iat + ONE_HOUR_IN_SECONDS,
                iss: account,
                sub: account,
                uid: uid,
            };
            if (_this.tenantId) {
                // eslint-disable-next-line @typescript-eslint/camelcase
                body.tenant_id = _this.tenantId;
            }
            if (Object.keys(claims).length > 0) {
                body.claims = claims;
            }
            var token = _this.encodeSegment(header) + "." + _this.encodeSegment(body);
            var signPromise = _this.signer.sign(Buffer.from(token));
            return Promise.all([token, signPromise]);
        }).then(function (_a) {
            var token = _a[0], signature = _a[1];
            return token + "." + _this.encodeSegment(signature);
        });
    };
    FirebaseTokenGenerator.prototype.encodeSegment = function (segment) {
        var buffer = (segment instanceof Buffer) ? segment : Buffer.from(JSON.stringify(segment));
        return utils_1.toWebSafeBase64(buffer).replace(/=+$/, '');
    };
    /**
     * Returns whether or not the provided developer claims are valid.
     *
     * @param {object} [developerClaims] Optional developer claims to validate.
     * @return {boolean} True if the provided claims are valid; otherwise, false.
     */
    FirebaseTokenGenerator.prototype.isDeveloperClaimsValid_ = function (developerClaims) {
        if (typeof developerClaims === 'undefined') {
            return true;
        }
        return validator.isNonNullObject(developerClaims);
    };
    return FirebaseTokenGenerator;
}());
exports.FirebaseTokenGenerator = FirebaseTokenGenerator;

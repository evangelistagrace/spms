/*! firebase-admin v9.5.0 */
"use strict";
/*!
 * Copyright 2020 Google Inc.
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
exports.InstanceId = void 0;
var error_1 = require("../utils/error");
var instance_id_request_internal_1 = require("./instance-id-request-internal");
var validator = require("../utils/validator");
/**
 * Gets the {@link InstanceId `InstanceId`} service for the
 * current app.
 *
 * @example
 * ```javascript
 * var instanceId = app.instanceId();
 * // The above is shorthand for:
 * // var instanceId = admin.instanceId(app);
 * ```
 *
 * @return The `InstanceId` service for the
 *   current app.
 */
var InstanceId = /** @class */ (function () {
    /**
     * @param {FirebaseApp} app The app for this InstanceId service.
     * @constructor
     */
    function InstanceId(app) {
        if (!validator.isNonNullObject(app) || !('options' in app)) {
            throw new error_1.FirebaseInstanceIdError(error_1.InstanceIdClientErrorCode.INVALID_ARGUMENT, 'First argument passed to admin.instanceId() must be a valid Firebase app instance.');
        }
        this.app_ = app;
        this.requestHandler = new instance_id_request_internal_1.FirebaseInstanceIdRequestHandler(app);
    }
    /**
     * Deletes the specified instance ID and the associated data from Firebase.
     *
     * Note that Google Analytics for Firebase uses its own form of Instance ID to
     * keep track of analytics data. Therefore deleting a Firebase Instance ID does
     * not delete Analytics data. See
     * [Delete an Instance ID](/support/privacy/manage-iids#delete_an_instance_id)
     * for more information.
     *
     * @param instanceId The instance ID to be deleted.
     *
     * @return A promise fulfilled when the instance ID is deleted.
     */
    InstanceId.prototype.deleteInstanceId = function (instanceId) {
        return this.requestHandler.deleteInstanceId(instanceId)
            .then(function () {
            // Return nothing on success
        });
    };
    Object.defineProperty(InstanceId.prototype, "app", {
        /**
         * Returns the app associated with this InstanceId instance.
         *
         * @return {FirebaseApp} The app associated with this InstanceId instance.
         */
        get: function () {
            return this.app_;
        },
        enumerable: false,
        configurable: true
    });
    return InstanceId;
}());
exports.InstanceId = InstanceId;

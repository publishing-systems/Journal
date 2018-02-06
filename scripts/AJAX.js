/* Copyright (C) 2012-2018 Stephan Kreutzer
 *
 * This file is part of Journal.
 *
 * Journal is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License version 3 or any later
 * version of the license, as published by the Free Software Foundation.
 *
 * Journal is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License 3 for more details.
 *
 * You should have received a copy of the GNU Affero General Public License 3
 * along with Journal. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

let AJAX = (function()
{
    let connection = null;

    function CreateConnection()
    {
        let xmlhttp = null;

        // Mozilla
        if (window.XMLHttpRequest)
        {
            xmlhttp = new XMLHttpRequest();
        }
        // IE
        else if (window.ActiveXObject)
        {
            xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
        }

        return xmlhttp;
    }

    let object =
    {
        GetConnection: function()
        {
            if (connection == null)
            {
                connection = CreateConnection();
            }
            else
            {
                if (connection.readyState != 0 &&
                    connection.readyState != 4)
                {
                    return null;
                }
            }

            return connection;
        }
    }

    return object;
})();

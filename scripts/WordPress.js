/* Copyright (C) 2018 Stephan Kreutzer
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

function GetPost(connection, baseURL, page, callback)
{
    if (connection == null)
    {
        return -1;
    }

    if (typeof page != "number")
    {
        return -1;
    }

    connection.open('GET', baseURL + "/wp-json/wp/v2/posts?page=" + page + "&per_page=1", true);
    connection.setRequestHeader('Content-Type', 'application/json');
    /* CORS: Browsers are stupid.
    connection.setRequestHeader('User-Agent', 'Journal Client (publishing-systems.org)');
    */
    connection.onreadystatechange = function()
    {
        if (connection.readyState != 4)
        {
            // Waiting...
            return;
        }

        if (connection.status == 200)
        {
            callback(JSON.parse(connection.response)[0]);
        }
        else if (connection.status == 0 ||
                 connection.status == 400)
        {
            callback(null);
        }
        else
        {
            throw connection.status;
        }
    };

    connection.send();
    return 0;
}

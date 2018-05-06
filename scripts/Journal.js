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

function LoadJournal()
{
    var loadStage = 1;

    function LoadQueue()
    {
        if (loadStage == 1)
        {
            LoadPosts(["https://doug-50.info/journal"], function() { loadStage += 1; LoadQueue(); });
        }
        else if (loadStage == 2)
        {
            LoadGlossary(["https://doug-50.info/journal"], function() { loadStage += 1; LoadQueue(); });
        }
        else if (loadStage == 3)
        {
            console.log("Loading stages completed.");
            alert("Loading stages completed.");
        }
    }

    LoadQueue();
}


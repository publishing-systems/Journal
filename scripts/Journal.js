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

function LoadJournal()
{
    var connection = AJAX.GetConnection();

    if (connection == null)
    {
        return;
    }

    var page = 1;
    var site = 0;
    var urls = [ "https://doug-50.info/journal",
                 /* TODO: This should filter for a still missing category "Hypertext"! */
                 "https://skreutzer.de" ];

    var LoadPost = function(data)
    {
        if (data == null)
        {
            ++site;
            page = 1;

            if (site < urls.length)
            {
                GetPost(connection, urls[site], page, LoadPost);
            }
            
            return;
        }

        if (RenderPost(data) != 0)
        {
            return;
        }

        page += 1;

        GetPost(connection, urls[site], page, LoadPost);
    };

    GetPost(connection, urls[site], page, LoadPost);
}

function RenderPost(post)
{
    var destination = document.getElementById('content');

    if (destination == null)
    {
        return -1;
    }

    // TODO: Classes should be IANA microformats!

    var container = document.createElement("div");
    container.setAttribute("class", "post");

    var header = document.createElement("h2");
    header.setAttribute("class", "post-title");

    var headerText = document.createTextNode(post.title.rendered);
    header.appendChild(headerText);
    container.appendChild(header);

    var source = document.createElement("a");
    source.setAttribute("href", post.link);

    var sourceCaption = document.createTextNode(post.link);
    source.appendChild(sourceCaption);
    container.appendChild(source);

    var posted = document.createElement("div");
    posted.setAttribute("class", "post-posted");

    var postedCaption = document.createTextNode("Posted: ");
    posted.appendChild(postedCaption);

    var postedSpan = document.createElement("span");
    postedSpan.setAttribute("class", "post-posted-date");

    var postedText = document.createTextNode(post.date_gmt + "Z");
    postedSpan.appendChild(postedText);
    posted.appendChild(postedSpan);
    container.appendChild(posted);

    if (post.modified_gmt != post.date_gmt)
    {
        var modified = document.createElement("div");
        modified.setAttribute("class", "post-modified");

        var modifiedCaption = document.createTextNode("Modified: ");
        modified.appendChild(modifiedCaption);

        var modifiedSpan = document.createElement("span");
        modifiedSpan.setAttribute("class", "post-modified-date");

        var modifiedText = document.createTextNode(post.modified_gmt + "Z");
        modifiedSpan.appendChild(modifiedText);
        modified.appendChild(modifiedSpan);
        container.appendChild(modified);
    }

    var content = document.createElement("p");
    content.setAttribute("class", "post-content");

    var contentText = document.createTextNode(post.content.rendered);
    content.appendChild(contentText);
    container.appendChild(content);
    
    destination.appendChild(container);

    return 0;
}

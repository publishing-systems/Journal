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

function LoadPosts(callback)
{
    let connection = AJAX.GetConnection();

    if (connection == null)
    {
        return;
    }

    let page = 1;
    let site = 0;
    let urls = [ "https://doug-50.info/journal",
                 "https://skreutzer.de" ];

    let LoadPost = function(data)
    {
        if (data == null)
        {
            ++site;
            page = 1;

            if (site < urls.length)
            {
                GetPost(connection, urls[site], page, LoadPost);
            }
            else
            {
                if (typeof(callback) != 'undefined')
                {
                    if (callback != null)
                    {
                        callback();
                    }
                }
            }

            return;
        }

        // TODO: No filtering in advance yet!
        let render = true;

        if (urls[site] == "https://doug-50.info/journal" &&
            data.categories.includes(12) == true)
        {
            render = false;
        }

        if (urls[site] == "https://skreutzer.de" &&
            data.categories.includes(3) != true)
        {
            render = false;
        }

        if (render == true)
        {
            if (RenderPost(data) != 0)
            {
                return;
            }
        }

        page += 1;

        GetPost(connection, urls[site], page, LoadPost);
    };

    GetPost(connection, urls[site], page, LoadPost);
}

function RenderPost(post)
{
    // TODO: Limitation to a post category for demo purposes, to
    // avoid extreme script execution time for glossary application
    // on everything.
    if (post.link.toLowerCase().indexOf("doug-50.info") < 0 ||
        post.categories.includes(3) != true)
    {
        return 0;
    }

    let destination = document.getElementById('content-pane');

    if (destination == null)
    {
        return -1;
    }

    // TODO: Classes should be IANA microformats!

    let parent = document.getElementById('posts');

    if (parent == null)
    {
        parent = document.createElement("div");
        parent.setAttribute("class", "posts");
        parent.setAttribute("id", "posts");
        destination.appendChild(parent);
    }

    let container = document.createElement("div");
    container.setAttribute("class", "post");

    let header = document.createElement("h2");
    header.setAttribute("class", "post-title");

    let headerText = document.createTextNode(post.title.rendered);
    header.appendChild(headerText);
    container.appendChild(header);

    let source = document.createElement("a");
    source.setAttribute("href", post.link);

    let sourceCaption = document.createTextNode(post.link);
    source.appendChild(sourceCaption);
    container.appendChild(source);

    let posted = document.createElement("div");
    posted.setAttribute("class", "post-posted");

    let postedCaption = document.createTextNode("Posted: ");
    posted.appendChild(postedCaption);

    let postedSpan = document.createElement("span");
    postedSpan.setAttribute("class", "post-posted-date");

    let postedText = document.createTextNode(post.date_gmt + "Z");
    postedSpan.appendChild(postedText);
    posted.appendChild(postedSpan);
    container.appendChild(posted);

    if (post.modified_gmt != post.date_gmt)
    {
        let modified = document.createElement("div");
        modified.setAttribute("class", "post-modified");

        let modifiedCaption = document.createTextNode("Modified: ");
        modified.appendChild(modifiedCaption);

        let modifiedSpan = document.createElement("span");
        modifiedSpan.setAttribute("class", "post-modified-date");

        let modifiedText = document.createTextNode(post.modified_gmt + "Z");
        modifiedSpan.appendChild(modifiedText);
        modified.appendChild(modifiedSpan);
        container.appendChild(modified);
    }

    let content = document.createElement("div");
    content.setAttribute("class", "post-content");

    let innerHTML = "";
    let stream = new CharacterStream(post.content.rendered);
    let reader = createXMLEventReader(stream);
    reader.addToEntityReplacementDictionary("#8216", "‘");
    reader.addToEntityReplacementDictionary("#8217", "’");
    reader.addToEntityReplacementDictionary("#8220", "“");
    reader.addToEntityReplacementDictionary("#8221", "”");
    reader.addToEntityReplacementDictionary("#8230", "…");
    reader.addToEntityReplacementDictionary("nbsp", " ");
    reader.addToEntityReplacementDictionary("#8211", "–");
    reader.addToEntityReplacementDictionary("#038", "&");
    reader.addToEntityReplacementDictionary("#8222", "„");

    while (reader.hasNext() == true)
    {
        let event = reader.nextEvent();

        if (event instanceof StartElement)
        {
            let name = event.getName().getLocalPart().toLowerCase();

            if (name == "p" ||
                name == "em" ||
                name == "ul" ||
                name == "ol" ||
                name == "li" ||
                name == "strong")
            {
                innerHTML += "<" + name + ">";
            }
            else if (name == "a")
            {
                // TODO: This needs to become event.getAttributeByName() eventually.
                let href = event.getAttributes();

                for (let i = 0; i < href.length; i++)
                {
                    if (href[i].getName().getLocalPart().toLowerCase() == "href")
                    {
                        href = href[i].getValue();
                        break;
                    }
                }

                if (Array.isArray(href) == true)
                {
                    continue;
                }

                // Ampersand needs to be the first, otherwise it would
                // double-escape other entities.
                innerHTML += "<a href=\"" + href.replace(new RegExp('&', 'g'), "&amp;")
                                                .replace(new RegExp('"', 'g'), "&quot;")
                                                .replace(new RegExp('<', 'g'), "lt;") + "\">";

                while (reader.hasNext() == true)
                {
                    event = reader.nextEvent();

                    if (event instanceof StartElement)
                    {
                        if (event.getName().getLocalPart().toLowerCase() == "a")
                        {
                            throw "Nested element 'a'.";
                        }
                    }
                    else if (event instanceof Characters)
                    {
                        // Ampersand needs to be the first, otherwise it would
                        // double-escape other entities.
                        innerHTML += event.getData().replace(new RegExp('&', 'g'), "&amp;")
                                                    .replace(new RegExp('<', 'g'), "&lt;")
                                                    .replace(new RegExp('>', 'g'), "&gt;");
                    }
                    else if (event instanceof EndElement)
                    {
                        if (event.getName().getLocalPart().toLowerCase() == "a")
                        {
                            innerHTML += "</a>";
                            break;
                        }
                    }
                }
            }
        }
        else if (event instanceof Characters)
        {
            // Ampersand needs to be the first, otherwise it would
            // double-escape other entities.
            innerHTML += event.getData().replace(new RegExp('&', 'g'), "&amp;")
                                        .replace(new RegExp('<', 'g'), "&lt;")
                                        .replace(new RegExp('>', 'g'), "&gt;");
        }
        else if (event instanceof EndElement)
        {
            let name = event.getName().getLocalPart().toLowerCase();

            if (name == "p" ||
                name == "em" ||
                name == "ul" ||
                name == "ol" ||
                name == "li" ||
                name == "strong")
            {
                innerHTML += "</" + name + ">";
            }
        }
    }

    content.innerHTML = innerHTML;
    container.appendChild(content);

    parent.appendChild(container);

    return 0;
}

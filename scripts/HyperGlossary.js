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

function LoadGlossary(callback)
{
    let connection = AJAX.GetConnection();

    if (connection == null)
    {
        return;
    }

    let page = 1;
    let site = 0;
    let urls = [ "https://doug-50.info/journal" ];

    let LoadEntry = function(data)
    {
        if (data == null)
        {
            ++site;
            page = 1;

            if (site < urls.length)
            {
                GetPost(connection, urls[site], page, LoadEntry);
            }
            else
            {
                if (typeof(callback) != 'undefined')
                {
                    if (callback != null)
                    {
                        ApplyGlossary();
                        callback();
                    }
                }
            }

            return;
        }

        if (data.categories.includes(12) == true)
        {
            if (RenderEntry(data) != 0)
            {
                return;
            }
        }

        page += 1;

        GetPost(connection, urls[site], page, LoadEntry);
    };

    GetPost(connection, urls[site], page, LoadEntry);
}


function RenderEntry(entry)
{
    let destination = document.getElementById('content');

    if (destination == null)
    {
        return -1;
    }

    // TODO: Classes should be IANA microformats!

    let parent = document.getElementById('glossary');

    if (parent == null)
    {
        parent = document.createElement("div");
        parent.setAttribute("class", "glossary");
        parent.setAttribute("id", "glossary");
        destination.appendChild(parent);

        let header = document.createElement("h2");
        let headerText = document.createTextNode("Glossary");
        header.appendChild(headerText);
        parent.append(header);
    }

    let container = parent.getElementsByTagName("dl");

    if (container.length <= 0)
    {
        container = document.createElement("dl");
        parent.appendChild(container);
    }
    else
    {
        container = container[0];
    }

    let term = document.createElement("dt");
    let termText = document.createTextNode(entry.title.rendered);
    term.appendChild(termText);
    container.appendChild(term);

    let description = document.createElement("dd");
    let descriptionText = "";

    // TODO: Remove workaround for https://github.com/mediaelement/mediaelement/pull/2498.
    entry.content.rendered = entry.content.rendered.replace(new RegExp("allowfullscreen", 'g'), "allowfullscreen=\"true\"");

    let stream = new CharacterStream(entry.content.rendered);
    let reader = createXMLEventReader(stream);
    reader.addToEntityReplacementDictionary("#8216", "‘");
    reader.addToEntityReplacementDictionary("#8217", "’");
    reader.addToEntityReplacementDictionary("#8220", "“");
    reader.addToEntityReplacementDictionary("#8221", "”");
    reader.addToEntityReplacementDictionary("#8230", "…");
    reader.addToEntityReplacementDictionary("nbsp", " ");
    reader.addToEntityReplacementDictionary("#8211", "–");
    reader.addToEntityReplacementDictionary("#038", "&");

    while (reader.hasNext() == true)
    {
        let event = reader.nextEvent();

        if (event instanceof Characters)
        {
            // Ampersand needs to be the first, otherwise it would
            // double-escape other entities.
            descriptionText += event.getData().replace(new RegExp('&', 'g'), "&amp;")
                                              .replace(new RegExp('<', 'g'), "&lt;")
                                              .replace(new RegExp('>', 'g'), "&gt;");
        }
    }

    descriptionText = document.createTextNode(descriptionText);
    description.appendChild(descriptionText);
    container.appendChild(description);

    return 0;
}

function ApplyGlossary()
{
    let glossary = new Map();
    let definitions = document.getElementsByTagName("dl");

    for (let i = 0; i < definitions.length; i++)
    {
        let definition = definitions[i];

        for (let j = 0; j < definition.children.length; )
        {
            let term = definition.children[j];

            if (term.tagName.toLowerCase() != "dt")
            {
                j += 1;
                continue;
            }

            if (j + 1 >= definition.children.length)
            {
                break;
            }

            let description = definition.children[j + 1];

            if (description.tagName.toLowerCase() != "dd")
            {
                j += 2;
                continue;
            }

            glossary.set(term.innerText.toLowerCase(), description.innerText);

            j += 2;
        }
    }

    let posts = document.getElementsByClassName("post-content");

    for (let i = 0; i < posts.length; i++)
    {
        var nodes = ReplaceText(posts[i], glossary);

        if (nodes.length > 0)
        {
            for (let j = 0; j < nodes.length; j++)
            {
                node.insertBefore(nodes[j], node.childNodes[i]);
                i += 1;
            }

            node.removeChild(node.childNodes[i]);
        }
    }
}

function ReplaceText(node, glossary)
{
    let result = new Array();

    if (node.nodeType == Node.TEXT_NODE)
    {
        let tokens = tokenize(node.data);
        let innerText = "";

        for (let i = 0; i < tokens.length; i++)
        {
            if (glossary.has(tokens[i].toLowerCase()) == true)
            {
                if (innerText.length > 0)
                {
                    result.push(document.createTextNode(innerText));
                    innerText = "";
                }

                let span = document.createElement("span");
                span.setAttribute("class", "glossary-usage");

                let spanText = document.createTextNode(tokens[i]);
                span.appendChild(spanText);

                result.push(span);
            }
            else
            {
                // Ampersand needs to be the first, otherwise it would
                // double-escape other entities.
                innerText += tokens[i].replace(new RegExp('&', 'g'), "&amp;")
                                      .replace(new RegExp('<', 'g'), "&lt;")
                                      .replace(new RegExp('>', 'g'), "&gt;");
            }
        }

        if (result.length > 0 && innerText.length > 0)
        {
            result.push(document.createTextNode(innerText));
        }
    }
    else if (node.nodeType == Node.ELEMENT_NODE)
    {
        if (node.tagName.toLowerCase() == "a")
        {
            return result;
        }

        for (let i = 0; i < node.childNodes.length; i++)
        {
            var nodes = ReplaceText(node.childNodes[i], glossary);

            if (nodes.length > 0)
            {
                for (let j = 0; j < nodes.length; j++)
                {
                    node.insertBefore(nodes[j], node.childNodes[i]);
                    i += 1;
                }

                node.removeChild(node.childNodes[i]);
            }
        }
    }

    return result;
}

function tokenize(text)
{
    let tokens = new Array();
    let startPos = -1;

    for (let i = 0; i < text.length; i++)
    {
        if (/[a-zA-Z]/i.test(text[i]) == true)
        {
            if (startPos < 0)
            {
                startPos = i;
            }
        }
        else
        {
            if (startPos >= 0)
            {
                tokens.push(text.substring(startPos, i));
                startPos = -1;
            }

            tokens.push(text[i]);
        }
    }

    if (startPos >= 0)
    {
        tokens.push(text.substring(startPos));
        startPos = -1;
    }

    return tokens;
}


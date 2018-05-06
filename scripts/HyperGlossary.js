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

function LoadGlossary(urls, callback)
{
    if (Array.isArray(urls) != true)
    {
        console.log("Parameter 'urls' is not an array.");
        return;
    }

    if (urls.length <= 0)
    {
        console.log("No glossary URL specified.");
        return;
    }

    let connection = AJAX.GetConnection();

    if (connection == null)
    {
        return;
    }

    let page = 1;
    let site = 0;
    let entryIndex = 0;

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
            if (RenderEntry(data, entryIndex) == 0)
            {
                ++entryIndex;
            }
            else
            {
                return;
            }
        }

        page += 1;

        GetPost(connection, urls[site], page, LoadEntry);
    };

    GetPost(connection, urls[site], page, LoadEntry);
}


function RenderEntry(entry, index)
{
    let destination = document.getElementById('content-pane');

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
        let headerText = document.createTextNode("Definitions");
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

    // TODO: Remove workaround for https://github.com/mediaelement/mediaelement/pull/2498.
    entry.content.rendered = entry.content.rendered.replace(new RegExp("allowfullscreen", 'g'), "allowfullscreen=\"true\"");

    let stream = new CharacterStream(entry.content.rendered);
    let reader = createXMLEventReader(stream);
    reader.addToEntityReplacementDictionary("#8211", "–");
    reader.addToEntityReplacementDictionary("#8212", "—");
    reader.addToEntityReplacementDictionary("#8216", "‘");
    reader.addToEntityReplacementDictionary("#8217", "’");
    reader.addToEntityReplacementDictionary("#8220", "“");
    reader.addToEntityReplacementDictionary("#8221", "”");
    reader.addToEntityReplacementDictionary("#8222", "„");
    reader.addToEntityReplacementDictionary("#8230", "…");
    reader.addToEntityReplacementDictionary("nbsp", " ");

    let glossary = "";

    while (reader.hasNext() == true)
    {
        let event = reader.nextEvent();

        if (event instanceof StartElement)
        {
            if (event.getName().getLocalPart().toLowerCase() == "dl")
            {
                // All of this parsing isn't really necessary, as the StAX
                // reader could well recreate the elements and their text
                // for being transferred to the .innerHTML of the target,
                // but the handling here is done to have an object model
                // for easier manipulation with code and demonstration
                // purposes.
                let parser = new XhtmlDefinitionListParser(reader);
                glossary = parser.parse();
                break;
            }
        }
        else if (event instanceof Characters)
        {
            glossary += event.getData();
        }
    }

    if (glossary instanceof Array)
    {
        if (glossary.length <= 0)
        {
            return 0;
        }

        if (glossary[0].name.toLowerCase() != "dt")
        {
            throw "Definition list doesn't start with definition term.";
        }

        for (let i = 0; i < glossary.length; i++)
        {
            let element = document.createElement(glossary[i].name);
            element.setAttribute("class", "term-" + index);
            let textContent = document.createTextNode(XmlEscapeCharacters(glossary[i].text));
            element.appendChild(textContent);
            container.appendChild(element);
        }
    }
    else if (typeof glossary === "string")
    {
        if (glossary.length <= 0)
        {
            return 0;
        }

        let term = document.createElement("dt");
        term.setAttribute("class", "term-" + index);
        let termText = document.createTextNode(XmlEscapeCharacters(entry.title.rendered));
        term.appendChild(termText);
        container.appendChild(term);

        let description = document.createElement("dd");
        description.setAttribute("class", "term-" + index);
        let descriptionText = document.createTextNode(glossary);
        description.appendChild(descriptionText);
        container.appendChild(description);
    }

    return 0;
}

function ApplyGlossary()
{
    let glossary = new Array();
    let definitions = document.getElementsByTagName("dl");

    let entry = new Object();
    entry.terms = null;
    entry.descriptions = null;

    for (let i = 0; i < definitions.length; i++)
    {
        let definition = definitions[i];

        for (let j = 0; j < definition.children.length; j++)
        {
            let child = definition.children[j];

            if (child.tagName.toLowerCase() == "dt")
            {
                if (entry.descriptions != null)
                {
                    if (entry.descriptions != null)
                    {
                        glossary.push(entry);

                        entry = new Object();
                        entry.terms = null;
                        entry.descriptions = null;
                    }
                    else
                    {
                        throw "Definition terms without descriptions.";
                    }
                }

                if (entry.terms == null)
                {
                    entry.terms = new Array();
                }

                let termTokens = tokenize(child.innerText.toLowerCase());

                entry.terms.push(termTokens);
            }
            else if (child.tagName.toLowerCase() == "dd")
            {
                if (entry.terms == null)
                {
                    throw "Definition description without terms.";
                }

                if (entry.descriptions == null)
                {
                    entry.descriptions = new Array();
                }

                entry.descriptions.push(child.innerText);
            }
        }
    }

    if (entry.descriptions != null)
    {
        glossary.push(entry);
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
            let found = false;

            for (let j = 0; j < glossary.length && found == false; j++)
            {
                for (let k = 0; k < glossary[j].terms.length && found == false; k++)
                {
                    let termTokens = glossary[j].terms[k];
                    let matched = true;

                    if (tokens.length - i < termTokens.length)
                    {
                        continue;
                    }

                    for (let l = 0; l < termTokens.length; l++)
                    {
                        if (i + l >= tokens.length)
                        {
                            matched = false;
                            break;
                        }

                        if (tokens[i + l].toLowerCase() !== termTokens[l].toLowerCase())
                        {
                            matched = false;
                            break;
                        }
                    }

                    if (matched == true)
                    {
                        if (innerText.length > 0)
                        {
                            result.push(document.createTextNode(innerText));
                            innerText = "";
                        }

                        let span = document.createElement("span");
                        span.setAttribute("class", "glossary-usage");
                        span.setAttribute("onclick", "showTerm('term-" + j + "');");

                        let textContent = "";

                        for (let l = 0; l < termTokens.length; l++)
                        {
                            textContent += tokens[i];
                            ++i;
                        }

                        // Because the next iteration will increment it again.
                        --i;

                        let spanText = document.createTextNode(textContent);
                        span.appendChild(spanText);

                        result.push(span);
                        found = true;
                        break;
                    }
                }

                if (found == true)
                {
                    break;
                }
            }

            if (found == false)
            {
                // Ampersand needs to be the first, otherwise it would
                // double-escape other entities.
                innerText += XmlEscapeCharacters(tokens[i]);
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

function XmlEscapeCharacters(input)
{
    // Ampersand needs to be the first, otherwise it would
    // double-escape other entities.
    return input.replace(new RegExp('&', 'g'), "&amp;")
                .replace(new RegExp('<', 'g'), "&lt;")
                .replace(new RegExp('>', 'g'), "&gt;");
}

function XhtmlDefinitionListParser(reader)
{
    let self = this;

    let _reader = reader;

    self.parse = function()
    {
        let definition = new Array();

        while (_reader.hasNext() == true)
        {
            let event = reader.nextEvent();

            if (event instanceof StartElement)
            {
                let name = event.getName().getLocalPart().toLowerCase();

                if (name == "dt" ||
                    name == "dd")
                {
                    let textContent = HandleEntry(name);

                    if (textContent.length > 0)
                    {
                        let entry = new Object();
                        entry.name = name;
                        entry.text = textContent;

                        definition.push(entry);
                    }
                }
            }
            else if (event instanceof EndElement)
            {
                if (event.getName().getLocalPart().toLowerCase() == "dl")
                {
                    return definition;
                }
            }
        }

        throw "XhtmlDefinitionListParser: Definition List not well-formed.";
    }

    function HandleEntry(name)
    {
        let textContent = "";

        while (_reader.hasNext() == true)
        {
            let event = reader.nextEvent();

            if (event instanceof Characters)
            {
                textContent += event.getData();
            }
            else if (event instanceof EndElement)
            {
                if (event.getName().getLocalPart().toLowerCase() == name.toLowerCase())
                {
                    break;
                }
            }
        }

        return textContent;
    }
}

function showTerm(id)
{
    hideTerm();

    let definition = document.getElementsByClassName(id);

    if (definition == null)
    {
        return -1;
    }

    if (definition.length <= 0)
    {
        return -1;
    }

    let parent = document.getElementById('glossary-pane');

    if (parent == null)
    {
        return -1;
    }

    let destination = document.createElement("dl");
    parent.appendChild(destination);

    for (let i = 0; i < definition.length; i++)
    {
        let element = definition[i].cloneNode(true);
        // Otherwise DOM would update definition.length as the nodes would
        // be cloned with their class attribute, leading to an infinite loop.
        element.removeAttribute("class");
        destination.appendChild(element);
    }

    return 0;
}

function hideTerm()
{
    let parent = document.getElementById('glossary-pane');

    if (parent == null)
    {
        return -1;
    }

    let glossary = parent.getElementsByTagName("dl");

    // Stupid JavaScript has a cloneNode(deep), but no removeNode(deep).
    let removeNode = function(element, parent)
    {
        while (element.hasChildNodes == true)
        {
            removeNode(element.lastChild, element);
        }

        parent.removeChild(element);
    }

    for (let i = 0; i < glossary.length; i++)
    {
        removeNode(glossary[i], parent);
    }

    return 0;
}

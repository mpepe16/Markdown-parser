"use strict";
// These enums are goin go represent our master list of tags
var TagType;
(function (TagType) {
    TagType[TagType["Paragraph"] = 0] = "Paragraph";
    TagType[TagType["Header1"] = 1] = "Header1";
    TagType[TagType["Header2"] = 2] = "Header2";
    TagType[TagType["Header3"] = 3] = "Header3";
    TagType[TagType["HorizontalRule"] = 4] = "HorizontalRule";
})(TagType || (TagType = {}));
// This class is responsible for getting the textare and the label html elements
// and fill the markDown output with the value from the markdown property.
class HtmlHandler {
    constructor() {
        this.markdownChange = new Markdown;
    }
    TextChangeHandler(id, output) {
        let markdown = document.getElementById(id);
        let markdownOutput = document.getElementById(output);
        if (markdown !== null) {
            markdown.onkeyup = (e) => {
                this.RenderHtmlContent(markdown, markdownOutput);
            };
            window.onload = (e) => {
                this.RenderHtmlContent(markdown, markdownOutput);
            };
        }
    }
    RenderHtmlContent(markdown, markdownOutput) {
        if (markdown.value) {
            markdownOutput.innerHTML =
                this.markdownChange.ToHtml(markdown.value);
        }
        else
            markdownOutput.innerHTML = "<p></p>";
    }
}
class TagTypeToHtml {
    // The constructor setting the map elements accordingly.
    constructor() {
        // The readonly keyword means that after the class instantiation, the tagtype 
        // cannot be recreated elsewhere.
        this.tagType = new Map();
        this.tagType.set(TagType.Header1, "h1");
        this.tagType.set(TagType.Header2, "h2");
        this.tagType.set(TagType.Header3, "h3");
        this.tagType.set(TagType.Paragraph, "p");
        this.tagType.set(TagType.HorizontalRule, "hr");
    }
    // The GetTag private helper method is responsible for decide whether we need an opening
    // or closing tag. The method we can use both in the OpeningTag and ClosingTag functions.
    GetTag(tagType, openingPattern) {
        let tag = this.tagType.get(tagType);
        if (tag !== null) {
            return `${openingPattern}${tag}>`;
        }
        return `${openingPattern}p>`;
    }
    OpeningTag(tagType) {
        return this.GetTag(tagType, `<`);
    }
    ClosingTag(tagType) {
        return this.GetTag(tagType, `</`);
    }
}
// The MarkdownDocument class implements an interface with two methods:
// The Add method a string[] as parameter and fill the content with each element of it.
// while the Get method basically just give us the content.
class MarkdownDocument {
    constructor() {
        this.content = "";
    }
    Add(...content) {
        content.forEach(element => {
            this.content += element;
        });
    }
    Get() {
        return this.content;
    }
}
class ParseElement {
    constructor() {
        this.CurrentLine = "";
    }
}
class VisitorBase {
    constructor(tagType, TagTypeToHtml) {
        this.tagType = tagType;
        this.TagTypeToHtml = TagTypeToHtml;
    }
    Visit(token, markdownDocument) {
        markdownDocument.Add(this.TagTypeToHtml.OpeningTag(this.tagType), token.CurrentLine, this.TagTypeToHtml.ClosingTag(this.tagType));
    }
}
class Header1Visitor extends VisitorBase {
    constructor() {
        super(TagType.Header1, new TagTypeToHtml());
    }
}
class Header2Visitor extends VisitorBase {
    constructor() {
        super(TagType.Header2, new TagTypeToHtml());
    }
}
class Header3Visitor extends VisitorBase {
    constructor() {
        super(TagType.Header3, new TagTypeToHtml());
    }
}
class ParagraphVisitor extends VisitorBase {
    constructor() {
        super(TagType.Paragraph, new TagTypeToHtml());
    }
}
class HorizontalRuleVisitor extends VisitorBase {
    constructor() {
        super(TagType.HorizontalRule, new TagTypeToHtml());
    }
}
class Visitable {
    Accept(visitor, token, markdownDocument) {
        visitor.Visit(token, markdownDocument);
    }
}
class Handler {
    constructor() {
        this.next = null;
    }
    SetNext(next) {
        this.next = next;
    }
    HandleRequest(request) {
        if (!this.CanHandle(request)) {
            if (this.next !== null) {
                this.next.HandleRequest(request);
            }
            return;
        }
    }
}
class ParseChainHandler extends Handler {
    constructor(document, tagType, visitor) {
        super();
        this.document = document;
        this.tagType = tagType;
        this.visitor = visitor;
        this.visitable = new Visitable();
    }
    // The CanHandle function takes the request and create a tuple out of it
    // One part is a boolean which indicates whether there is a markdown symbol
    // and the other part is a string representing the currentline.
    // If the boolean is true we call the visitable property Accept method.
    CanHandle(request) {
        let split = new LineParser().Parse(request.CurrentLine, this.tagType);
        if (split[0]) {
            request.CurrentLine = split[1];
            this.visitable.Accept(this.visitor, request, this.document);
        }
        return split[0];
    }
}
// The sole purpose of this class is to give us a tuple:
// The tuple contains a boolean and a string without the markdown symbol.
class LineParser {
    Parse(value, tag) {
        let output = [false, ""];
        output[1] = value;
        if (value === "") {
            return output;
        }
        let split = value.startsWith(`${tag}`);
        if (split) {
            output[0] = true;
            output[1] = value.substring(tag.length);
        }
        return output;
    }
}
class ParagraphHandler extends Handler {
    constructor(document) {
        super();
        this.document = document;
        this.visitable = new Visitable();
        this.visitor = new ParagraphVisitor();
    }
    CanHandle(request) {
        this.visitable.Accept(this.visitor, request, this.document);
        return true;
    }
}
class Header1ChainHandler extends ParseChainHandler {
    constructor(document) {
        super(document, "# ", new Header1Visitor());
    }
}
class Header2ChainHandler extends ParseChainHandler {
    constructor(document) {
        super(document, "## ", new Header2Visitor());
    }
}
class Header3ChainHandler extends ParseChainHandler {
    constructor(document) {
        super(document, "### ", new Header3Visitor());
    }
}
class HorizontalRuleHandler extends ParseChainHandler {
    constructor(document) {
        super(document, "---", new HorizontalRuleVisitor());
    }
}
// This factory class is responsible for creating all the necessary classes for our chain.
// It's just basically creating all the necessary object and call their SetNext method in order to
// give them the proper next class they lead the program.
class ChainOfResponsibilityFactory {
    Build(document) {
        let header1 = new Header1ChainHandler(document);
        let header2 = new Header2ChainHandler(document);
        let header3 = new Header3ChainHandler(document);
        let horizontalRule = new HorizontalRuleHandler(document);
        let paragraph = new ParagraphHandler(document);
        header1.SetNext(header2);
        header2.SetNext(header3);
        header3.SetNext(horizontalRule);
        horizontalRule.SetNext(paragraph);
        return header1;
    }
}
//This class is our last step to wire up the app. 
//The ToHtml method take a single string, call the MarkDownDocument, COR factory first class(Header1)
// Split the parameter and start to parse 
class Markdown {
    ToHtml(text) {
        let document = new MarkdownDocument();
        let header1 = new ChainOfResponsibilityFactory().Build(document);
        let lines = text.split(`\n`);
        for (let index = 0; index < lines.length; index++) {
            let parseElement = new ParseElement();
            parseElement.CurrentLine = lines[index];
            header1.HandleRequest(parseElement);
        }
        return document.Get();
    }
}
//# sourceMappingURL=MarkdownParser.js.map
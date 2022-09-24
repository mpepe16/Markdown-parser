// These enums are goin go represent our master list of tags
enum TagType {
    Paragraph,
    Header1,
    Header2,
    Header3,
    HorizontalRule
   }
// This class is responsible for getting the textare and the label html elements
// and fill the markDown output with the value from the markdown property.
class HtmlHandler {
    public TextChangeHandler(id : string, output : string) : void {
    let markdown = <HTMLTextAreaElement>document.getElementById(id);
    let markdownOutput = <HTMLLabelElement>document.getElementById(output);
    if (markdown !== null) {
    markdown.onkeyup = (e) => {
    if (markdown.value) {
    markdownOutput.innerHTML = markdown.value;
    }
    else
    markdownOutput.innerHTML = "<p></p>";
    } }}}

   class TagTypeToHtml {
    // The readonly keyword means that after the class instantiation, the tagtype 
    // cannot be recreated elsewhere.
    private readonly tagType : Map<TagType,string> = new Map<TagType, string>();

    // The constructor setting the map elements accordingly.

    constructor() {
        this.tagType.set(TagType.Header1, "h1");
        this.tagType.set(TagType.Header2, "h2");
        this.tagType.set(TagType.Header3, "h3");
        this.tagType.set(TagType.Paragraph, "p");
        this.tagType.set(TagType.HorizontalRule, "hr")
    }

    // The GetTag private helper method is responsible for decide whether we need an opening
    // or closing tag. The method we can use both in the OpeningTag and ClosingTag functions.

    private GetTag(tagType: TagType, openingPattern: string) :string{
        let tag = this.tagType.get(tagType);
        if(tag !== null){
            return `${openingPattern}${tag}>`;
        }
        return `${openingPattern}p>`
    }
    public OpeningTag(tagType : TagType) : string {
        return this.GetTag(tagType, `<`);
       }
       public ClosingTag(tagType : TagType) : string {
        return this.GetTag(tagType, `</`);
       }
       
   }
   interface IMarkdownDocument {
    Add(...content : string[]) : void;
    Get() : string;
   }
    
   // The MarkdownDocument class implements an interface with two methods:
   // The Add method a string[] as parameter and fill the content with each element of it.
   // while the Get method basically just give us the content.
   class MarkdownDocument implements IMarkdownDocument {
    private content : string = "";
        Add(...content : string[]) : void {
        content.forEach(element => {
            this.content += element;
        })
    }
        Get():string {
        return this.content;
    }
   }
   class ParseElement {
    CurrentLine : string = "";
   }

   //The IVisitor and the IVisitable interfaces are both part of the visitor design patter. 
   interface IVisitor {
    Visit(token : ParseElement, markdownDocument :
   IMarkdownDocument) : void;
   }
   interface IVisitable {
    Accept(visitor : IVisitor, token : ParseElement,
   markdownDocument : IMarkdownDocument) : void;
   }

   abstract class VisitorBase implements IVisitor {
    constructor (private readonly tagType : TagType, private readonly TagTypeToHtml : TagTypeToHtml) {}
    Visit(token: ParseElement, markdownDocument:
    IMarkdownDocument): void {
    markdownDocument.Add(this.TagTypeToHtml.OpeningTag(this.tagType),
    token.CurrentLine,
     this.TagTypeToHtml.ClosingTag(this.tagType));
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
       
       class Visitable implements IVisitable {
        Accept(visitor: IVisitor, token: ParseElement, markdownDocument:
       IMarkdownDocument): void {
        visitor.Visit(token, markdownDocument);
        }
       }
       abstract class Handler<T> {
        protected next : Handler<T> | null = null;
        public SetNext(next : Handler<T>) : void {
        this.next = next;
        }
        public HandleRequest(request : T) : void {
        if (!this.CanHandle(request)) {
        if (this.next !== null) {
        this.next.HandleRequest(request);
        }
        return;
        }
        }
        protected abstract CanHandle(request : T) : boolean;
       }
       
       class ParseChainHandler extends Handler<ParseElement> {
        private readonly visitable : IVisitable = new Visitable();

        // The CanHandle function takes the request and create a tuple out of it
        // One part is a boolean which indicates whether there is a markdown symbol
        // and the other part is a string representing the currentline.
        // If the boolean is true we call the visitable property Accept method.

        protected CanHandle(request: ParseElement): boolean {
            let split = new LineParser().Parse(request.CurrentLine, this.tagType);
            if (split[0]){
                request.CurrentLine = split[1];
                this.visitable.Accept(this.visitor, request, this.document);
            }
            return split[0];
        }
        constructor(private readonly document : IMarkdownDocument,
        private readonly tagType : string,
        private readonly visitor : IVisitor) {
        super();
        }
       }
       // The sole purpose of this class is to give us a tuple:
       // The tuple contains a boolean and a string without the markdown symbol.
       class LineParser {
        public Parse(value : string, tag : string) : [boolean, string] {
        let output : [boolean, string] = [false, ""];
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
       
       
       class ParagraphHandler extends Handler<ParseElement> {
        private readonly visitable : IVisitable = new Visitable();
        private readonly visitor : IVisitor = new ParagraphVisitor()
        protected CanHandle(request: ParseElement): boolean {
        this.visitable.Accept(this.visitor, request, this.document);
        return true;
        }
        constructor(private readonly document : IMarkdownDocument) {
        super();
        }
       }

       class Header1ChainHandler extends ParseChainHandler {
        constructor(document : IMarkdownDocument) {
        super(document, "# ", new Header1Visitor());
        }
       }
       class Header2ChainHandler extends ParseChainHandler {
        constructor(document : IMarkdownDocument) {
        super(document, "## ", new Header2Visitor());
        }
       }
       class Header3ChainHandler extends ParseChainHandler {
        constructor(document : IMarkdownDocument) {
        super(document, "### ", new Header3Visitor());
        }
       }
       class HorizontalRuleHandler extends ParseChainHandler {
        constructor(document : IMarkdownDocument) {
        super(document, "---", new HorizontalRuleVisitor());
        }
       }

       // This factory class is responsible for creating all the necessary classes for our chain.
       // It's just basically creating all the necessary object and call their SetNext method in order to
       // give them the proper next class they lead the program.
       class ChainOfResponsibilityFactory {
        Build(document : IMarkdownDocument) : ParseChainHandler {
        let header1 : Header1ChainHandler = new
       Header1ChainHandler(document);
        let header2 : Header2ChainHandler = new
       Header2ChainHandler(document);
        let header3 : Header3ChainHandler = new
       Header3ChainHandler(document);
        let horizontalRule : HorizontalRuleHandler = new
       HorizontalRuleHandler(document);
        let paragraph : ParagraphHandler = new ParagraphHandler(document);
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
    public ToHtml(text : string) : string {
    let document : IMarkdownDocument = new MarkdownDocument();
    let header1 : Header1ChainHandler = new ChainOfResponsibilityFactory().Build(document);
    let lines : string[] = text.split(`\n`);
    for (let index = 0; index < lines.length; index++) {
    let parseElement : ParseElement = new ParseElement();
    parseElement.CurrentLine = lines[index];
    header1.HandleRequest(parseElement);
    }
    return document.Get();
    }
   }

       
    
   
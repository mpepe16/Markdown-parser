class HtmlHandler {
    public TextChangeHandler(id : string, output : string) : void {
    let markdown = <HTMLTextAreaElement>document.getElementById(id);
    let markdownOutput =
   <HTMLLabelElement>document.getElementById(output);
    if (markdown !== null) {
    markdown.onkeyup = (e) => {
    if (markdown.value) {
    markdownOutput.innerHTML = markdown.value;
    }
    else
    markdownOutput.innerHTML = "<p></p>";
    }
    }
    }
   }
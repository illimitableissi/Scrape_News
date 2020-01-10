$(document).ready(function(){

const scrapeArticles = () => {
    $.get('/scrape')
    .then((data)=>{
        $('body').html(data);
    }); 
}





$('#scrapebutton').on('click', scrapeArticles);

});
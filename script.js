$(document).ready(function () {
    $('#imageCarousel').carousel({
        interval: 3000
    });

    $('#avaliacoesCarousel').carousel({
        interval: 35000
    });

    $('#fotosCarousel').carousel({
        interval: 3000
    });

    $('#imageCarousel .carousel-control-prev').click(function () {
        $('#imageCarousel').carousel('prev');
    });

    $('#imageCarousel .carousel-control-next').click(function () {
        $('#imageCarousel').carousel('next');
    });

    $('#avaliacoesCarousel .carousel-control-prev').click(function () {
        $('#avaliacoesCarousel').carousel('prev');
    });

    $('#avaliacoesCarousel .carousel-control-next').click(function () {
        $('#avaliacoesCarousel').carousel('next');
    });

    $('#imageCarousel .carousel-control-prev').click(function () {
        $('#fotosCarousel').carousel('prev');
    });

    $('#imageCarousel .carousel-control-next').click(function () {
        $('#fotosCarousel').carousel('next');
    });
});

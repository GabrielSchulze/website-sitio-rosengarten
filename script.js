  <script>
    $(document).ready(function() {
      $('#imageCarousel').carousel({
        interval: false
      });

      $('.carousel-control-prev').click(function() {
        $('#imageCarousel').carousel('prev');
      });

      $('.carousel-control-next').click(function() {
        $('#imageCarousel').carousel('next');
      });
    });
  </script>




function searchMovie() {
    const input = document.getElementById("search").value.toLowerCase();

    if (input.trim() === "") {
        alert("Please enter a movie name");
        return false;
    }

    // find movie
    const result = movies.find(movie =>
        movie.name.toLowerCase().includes(input)
    );

    if (result) {
        // redirect to correct page
        window.location.href = result.page;
    } else {
        alert("Movie not found");
    }

    return false; // prevent form submit
}
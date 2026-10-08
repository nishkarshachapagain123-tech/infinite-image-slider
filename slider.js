/* =====================================================
   INFINITE IMAGE SLIDER
   JavaScript Implementation
   ===================================================== */


/*
   Create the slider class.
*/

class InfiniteSlider {

    constructor(options) {

        /* ---------------------------------------------
           Get HTML elements
           --------------------------------------------- */

        this.track =
            document.querySelector(options.track);

        this.viewport =
            document.querySelector(options.viewport);

        this.dotsContainer =
            document.querySelector(options.dots);

        this.nextButton =
            document.querySelector(options.nextButton);

        this.previousButton =
            document.querySelector(options.previousButton);


        /* ---------------------------------------------
           Store the slide data
           --------------------------------------------- */

        this.slides = options.slides;


        /* ---------------------------------------------
           Slider state
           --------------------------------------------- */

        /*
           Logical image index.

           Example:

           0 = first image
           1 = second image
           2 = third image
        */

        this.currentIndex = 0;


        /*
           Physical track index.

           The track contains:

           cloned last
           image 1
           image 2
           image 3
           ...
           cloned first

           Therefore, the first real image
           is at position 1.
        */

        this.trackIndex = 1;


        /*
           Prevent users from clicking buttons
           repeatedly while animation is running.
        */

        this.isAnimating = false;


        /* ---------------------------------------------
           Initialize the slider
           --------------------------------------------- */

        this.buildSlides();

        this.buildDots();

        this.bindEvents();

        this.updatePosition(false);

        this.updateDots();
    }


    /* =================================================
       CREATE SLIDES
       ================================================= */

    buildSlides() {

        /*
           Create cloned boundary slides.

           Example:

           Original:

           [1] [2] [3] [4] [5]

           New track:

           [5] [1] [2] [3] [4] [5] [1]

           The first 5 is a clone.
           The final 1 is a clone.
        */

        const slidesWithClones = [

            /* Clone last slide */
            this.slides[this.slides.length - 1],

            /* Original slides */
            ...this.slides,

            /* Clone first slide */
            this.slides[0]
        ];


        /*
           Convert the slide objects into HTML.
        */

        this.track.innerHTML =
            slidesWithClones
                .map((slide, index) => {

                    return `
                        <figure
                            class="slide"
                            data-track-index="${index}"
                        >

                            <img
                                src="${slide.src}"
                                alt="${slide.alt}"
                            >

                            <figcaption>
                                ${slide.caption}
                            </figcaption>

                        </figure>
                    `;
                })
                .join("");
    }


    /* =================================================
       CREATE NAVIGATION DOTS
       ================================================= */

    buildDots() {

        /*
           Create one dot for every original image.
        */

        this.dotsContainer.innerHTML =
            this.slides
                .map((slide, index) => {

                    return `
                        <button
                            class="dot${index === 0 ? " active" : ""}"
                            type="button"
                            aria-label="Go to image ${index + 1}"
                            aria-current="${index === 0 ? "true" : "false"}"
                            data-index="${index}"
                        >
                        </button>
                    `;
                })
                .join("");
    }


    /* =================================================
       EVENT LISTENERS
       ================================================= */

    bindEvents() {

        /*
           Next button
        */

        this.nextButton.addEventListener(
            "click",
            () => {

                this.goTo(
                    this.currentIndex + 1
                );

            }
        );


        /*
           Previous button
        */

        this.previousButton.addEventListener(
            "click",
            () => {

                this.goTo(
                    this.currentIndex - 1
                );

            }
        );


        /*
           Navigation dots

           Event delegation is used so one listener
           can handle all dots.
        */

        this.dotsContainer.addEventListener(
            "click",
            (event) => {

                const dot =
                    event.target.closest(".dot");


                /*
                   If the clicked element is not a dot,
                   stop here.
                */

                if (!dot) {
                    return;
                }


                /*
                   Get the image number
                   from data-index.
                */

                const index =
                    Number(dot.dataset.index);


                /*
                   Move to selected image.
                */

                this.goTo(index);
            }
        );


        /*
           Detect when the CSS animation finishes.
        */

        this.track.addEventListener(
            "transitionend",
            (event) => {

                /*
                   Only respond to transform animation.
                */

                if (event.propertyName !== "transform") {
                    return;
                }


                this.finishBoundaryTransition();
            }
        );


        /*
           Update the slider after browser resize.
        */

        window.addEventListener(
            "resize",
            () => {

                this.updatePosition(false);

            }
        );
    }


    /* =================================================
       MOVE TO IMAGE
       ================================================= */

    goTo(targetIndex) {

        /*
           Do not start another animation while
           the current animation is running.
        */

        if (
            this.isAnimating ||
            this.slides.length < 2
        ) {
            return;
        }


        /*
           Find the last real image index.

           If there are 5 images:

           lastIndex = 4
        */

        const lastIndex =
            this.slides.length - 1;


        /*
           Check whether the user is moving
           beyond the last image.
        */

        const isNextWrap =
            targetIndex > lastIndex;


        /*
           Check whether the user is moving
           before the first image.
        */

        const isPreviousWrap =
            targetIndex < 0;


        /* ---------------------------------------------
           NEXT BOUNDARY
           --------------------------------------------- */

        if (isNextWrap) {

            /*
               Logical index becomes first image.
            */

            this.currentIndex = 0;


            /*
               Move to the cloned first image.

               Example with 5 images:

               physical index = 6
            */

            this.trackIndex =
                this.slides.length + 1;
        }


        /* ---------------------------------------------
           PREVIOUS BOUNDARY
           --------------------------------------------- */

        else if (isPreviousWrap) {

            /*
               Logical index becomes last image.
            */

            this.currentIndex =
                lastIndex;


            /*
               Move to the cloned last image.

               Physical index = 0
            */

            this.trackIndex = 0;
        }


        /* ---------------------------------------------
           NORMAL MOVEMENT
           --------------------------------------------- */

        else {

            /*
               Update logical index.
            */

            this.currentIndex =
                targetIndex;


            /*
               Physical index is logical index + 1
               because position 0 is the cloned last slide.
            */

            this.trackIndex =
                targetIndex + 1;
        }


        /*
           Lock the slider while animation is running.
        */

        this.isAnimating = true;


        /*
           Update active dot immediately.
        */

        this.updateDots();


        /*
           Move the track with animation.
        */

        this.updatePosition(true);
    }


    /* =================================================
       UPDATE TRACK POSITION
       ================================================= */

    updatePosition(animate = true) {

        /*
           Turn transition on or off.
        */

        this.track.style.transition =
            animate
                ? ""
                : "none";


        /*
           Move the track horizontally.

           Example:

           trackIndex = 1

           translateX(-100%)

           trackIndex = 2

           translateX(-200%)
        */

        this.track.style.transform =
            `translateX(-${this.trackIndex * 100}%)`;


        /*
           If animation is disabled,
           restore the CSS transition after
           the browser updates the position.
        */

        if (!animate) {

            requestAnimationFrame(() => {

                this.track.style.transition = "";

            });
        }
    }


    /* =================================================
       FINISH BOUNDARY TRANSITION
       ================================================= */

    finishBoundaryTransition() {

        /*
           Check if we reached the cloned first image.

           Example:

           [5] [1] [2] [3] [4] [5] [1]
                                    ↑
                              cloned first
        */

        const atClonedFirst =
            this.trackIndex ===
            this.slides.length + 1;


        /*
           Check if we reached the cloned last image.
        */

        const atClonedLast =
            this.trackIndex === 0;


        /* ---------------------------------------------
           RESET AFTER NEXT LOOP
           --------------------------------------------- */

        if (atClonedFirst) {

            /*
               Move from cloned first
               to real first slide.
            */

            this.trackIndex = 1;


            /*
               Move without animation.

               The user will not notice because
               both images are identical.
            */

            this.updatePosition(false);
        }


        /* ---------------------------------------------
           RESET AFTER PREVIOUS LOOP
           --------------------------------------------- */

        else if (atClonedLast) {

            /*
               Move from cloned last
               to real last slide.
            */

            this.trackIndex =
                this.slides.length;


            /*
               Disable animation during reset.
            */

            this.updatePosition(false);
        }


        /*
           Animation is now finished.
        */

        this.isAnimating = false;


        /*
           Update navigation dots.
        */

        this.updateDots();
    }


    /* =================================================
       UPDATE ACTIVE DOT
       ================================================= */

    updateDots() {

        /*
           Get all dots and check each one.
        */

        [
            ...this.dotsContainer.children
        ].forEach((dot, index) => {

            /*
               Check whether this is the
               currently active image.
            */

            const active =
                index === this.currentIndex;


            /*
               Add or remove active class.
            */

            dot.classList.toggle(
                "active",
                active
            );


            /*
               Update accessibility state.
            */

            dot.setAttribute(
                "aria-current",
                active
                    ? "true"
                    : "false"
            );
        });
    }

}


/* =====================================================
   IMAGE DATA
   ===================================================== */

/*
   You can add or remove images here.

   The navigation dots will automatically
   adjust to the number of images.
*/

const slides = [

    {
        src: "https://picsum.photos/id/1015/1200/675",

        alt: "Mountain landscape beside a lake",

        caption: "Beautiful Mountain Landscape"
    },


    {
        src: "https://picsum.photos/id/1016/1200/675",

        alt: "Rocky mountain landscape",

        caption: "Rocky Mountain View"
    },


    {
        src: "https://picsum.photos/id/1025/1200/675",

        alt: "Dog looking toward the camera",

        caption: "Friendly Companion"
    },


    {
        src: "https://picsum.photos/id/1035/1200/675",

        alt: "Green landscape with trees and river",

        caption: "Beautiful Green Valley"
    },


    {
        src: "https://picsum.photos/id/1043/1200/675",

        alt: "Forest road surrounded by trees",

        caption: "Road Through the Forest"
    }

];


/* =====================================================
   START THE SLIDER
   ===================================================== */

new InfiniteSlider({

    track: "#sliderTrack",

    viewport: ".viewport",

    dots: "#sliderDots",

    nextButton: "#nextButton",

    previousButton: "#previousButton",

    slides: slides

});
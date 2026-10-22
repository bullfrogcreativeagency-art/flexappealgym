# Flex Appeal Gym website

Static website for Flex Appeal Gym, 107 Tankerton Road, Tankerton, Whitstable, Kent CT5 2AJ.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `thegym.html` | The Gym (story, reviews, supplements) |
| `theteam.html` | The Team (team slider) |
| `personal-training.html` | Personal Training (trainer switcher, links like `#josh` open a trainer) |
| `membership.html` | Membership prices |
| `equipment.html` | Equipment photo sliders |
| `contact.html` | Contact form (Formspree), hours and map |

## Structure

- `css/style.css` holds every style. Colours are set once at the top: red `#DC1B1B`, near-black `#181818` and white.
- `js/main.js` runs the menu, sliders, tabs, photo viewer, count-ups and the live "Open now" badge.
- `img/` holds web-sized photos. `img/gallery/` has a medium size (`-md`) for the sliders and a large size for the full-screen viewer.

## Updating opening hours

Hours appear in the footer of every page and on the Contact page. The "Open now" badge reads them from the `HOURS` line near the top of `js/main.js`, so change that too.

## Hosting

No build step. Upload the folder to any static host, such as GitHub Pages, Netlify or the current web host.

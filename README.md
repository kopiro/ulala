## Ulala

#### Show the _right_ things when you _scroll_

### Usage

Include the script in your page. I suggest you to use the RAWGIT CDN.

```html
<script src="https://unpkg.com/kopiro/ulala/master/ulala.min.js"></script>
<script>
  Ulala.init(/* config */);
</script>
```

### Features out of the box

#### Lazy loading

Just set `data-image=[URL]` to your tag HTML. The image will be loaded when it's visible and the `-loaded` class will be added.

If the tag is an `IMG`, the `src` attribute will be used. Otherwise, the image will be applied with a `background-image`.

Futhermore, unless you don't specify `noSuffixes: true` the image path will be rewritten based on device pixel ratio and the width.

#### Waypoint

Set `data-waypoint` on your tag, and when the scroll reach your element, the `-visible` class will be added.

_NOTE: If the tag is an image or a lazy loading image, the class will be added only when the image is fully loaded._

#### Parallax

Set the `data-parallax=[RATIO]` on your image, and wrap it in a simple `<div data-parallax-wrapper></div>`.

So the HTML must looks like this:

```
<div data-parallax-wrapper>
    <img data-parallax="0.5" src="[URL]" />
</div>
```

The `ratio` value sets how much enlarge the image to apply the parallax; the default value is `0.25`.

### Config in `.init()`

| Property     | Default    | Description                                                 |
| ------------ | ---------- | ----------------------------------------------------------- |
| preloadIn    | `1`        | Ratio of the window to trigger the loading                  |
| visibilityIn | `0`        | Ratio of the window to trigger the visibility               |
| visibleClass | `-visible` | The class to add when visible                               |
| loadedClass  | `-loaded`  | The class to add when an image is loaded                    |
| useSuffixes  | `true`     | Tell the lib to use / not use suffix for images (like `@2x` |

### LICENSE

MIT

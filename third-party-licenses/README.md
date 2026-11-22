# License texts for third-party components without their own license file

Some packages that end up in the app ship no license text in their npm package or crate. The texts here come
from the original sources and are included in `LICENSES.txt` (the app's license page and the installer) by
`scripts/license-plugin.ts`. If a new package has no text, the build stops.

| File | Applies to | Source |
|---|---|---|
| `onnxruntime-LICENSE.txt` | onnxruntime-web, onnxruntime-common (MIT, Microsoft) | `onnxruntime/LICENSE` from the PyPI package onnxruntime 1.31.0 |
| `onnxruntime-ThirdPartyNotices.txt` | onnxruntime-web (third-party code in the WASM files) | `onnxruntime/ThirdPartyNotices.txt` from the PyPI package onnxruntime 1.31.0 |
| `webview2-rs-LICENSE.txt` | webview2-com, webview2-com-macros, webview2-com-sys (MIT) | https://github.com/wravery/webview2-rs/blob/main/LICENSE |
| `webview2-sdk-LICENSE.txt` | WebView2LoaderStatic.lib, statically linked via webview2-com-sys (BSD-style, Microsoft) | License of the NuGet package Microsoft.Web.WebView2 1.0.3650.58 |
| `alloc-no-stdlib-LICENSE.txt` | alloc-stdlib (BSD-3-Clause, Dropbox) | https://github.com/dropbox/rust-alloc-no-stdlib/blob/master/LICENSE |
| `MPL-2.0.txt` | selectors (MPL-2.0, Servo) | https://www.mozilla.org/MPL/2.0/ |

The mapping is `EXTRA_TEXTS` in `scripts/license-plugin.ts`.

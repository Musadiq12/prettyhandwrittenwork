<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Public sample gallery discovers bundled public/samples image paths at build time and derives captions from config or filenames, so no stock fallback or runtime directory endpoint is needed.
- FAQ text is shared between the visible accordion and homepage structured data to keep customer policies consistent.
- Delivery address validation is conditional in both the public form and create_order RPC so PDF-only orders can be saved without an address.

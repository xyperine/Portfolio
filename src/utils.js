export async function loadAsText(url) {
    const response = await fetch(url);
    return await response.text();
}
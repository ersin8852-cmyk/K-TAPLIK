window.api = {
  fetchByIsbn: async (isbn) => {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    const data = json[`ISBN:${isbn}`];
    if (!data) return [];
    return [{
      isbn, title: data.title || 'Bilinmeyen Kitap',
      author: (data.authors || []).map(a => a.name).join(', ') || 'Bilinmeyen Yazar',
      publisher: (data.publishers || []).map(p => p.name).join(', ') || 'Yayınevi Belirtilmemiş',
      pageCount: data.number_of_pages || 0,
      year: (data.publish_date && data.publish_date.match(/\d{4}/)?.[0]) || '',
      price: '', cover: data.cover ? (data.cover.medium || data.cover.large || data.cover.small || '') : ''
    }];
  },

  fetchByTitle: async (q) => {
    let searchQ = q || '';
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQ)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,cover_edition_key,edition_key,isbn,publisher`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    const docs = json.docs || [];

    return await Promise.all(docs.map(async (doc) => {
      const cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '';
      const isbnCandidate = doc.isbn && doc.isbn[0];
      if (isbnCandidate) {
        try {
          const enriched = await window.api.fetchByIsbn(isbnCandidate);
          if (enriched.length && (enriched[0].publisher !== 'Yayınevi Belirtilmemiş' || enriched[0].pageCount)) {
            return { ...enriched[0], title: enriched[0].title || doc.title, author: enriched[0].author || doc.author_name?.join(', '), cover: enriched[0].cover || cover, year: enriched[0].year || doc.first_publish_year };
          }
        } catch (e) {}
      }
      const editionKey = doc.cover_edition_key || (doc.edition_key && doc.edition_key[0]);
      if (editionKey) {
        try {
          const eRes = await fetch(`https://openlibrary.org/books/${editionKey}.json`);
          if (eRes.ok) {
            const e = await eRes.json();
            const isbn = (e.isbn_13 && e.isbn_13[0]) || (e.isbn_10 && e.isbn_10[0]) || '';
            return { isbn, title: e.title || doc.title, author: doc.author_name?.join(', '), publisher: (e.publishers && e.publishers.join(', ')) || (doc.publisher && doc.publisher[0]) || 'Yayınevi Belirtilmemiş', pageCount: e.number_of_pages || 0, year: (e.publish_date && e.publish_date.match(/\d{4}/)?.[0]) || doc.first_publish_year || '', price: '', cover };
          }
        } catch (e) {}
      }
      return { isbn: '', title: doc.title, author: doc.author_name?.join(', '), publisher: (doc.publisher && doc.publisher[0]) || 'Yayınevi Belirtilmemiş', pageCount: 0, year: doc.first_publish_year || '', price: '', cover };
    }));
  }
};

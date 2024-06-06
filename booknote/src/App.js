import './App.css';
import logo from './logo.svg';
import cherryArrow from './cherry-arrow.svg';
import shelfImg from './shelf.svg';
import plus from './plus.svg';
import profile from './profile.svg';
import edit from './edit.svg';
import { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, where, query } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { BrowserRouter as Router, Route, Routes, useNavigate, Link, useParams } from 'react-router-dom';

function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
  
    function signUpUser (e) {
        e.preventDefault();
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {navigate("/login")})
        .catch((error) => {
            console.error(error.code, error.message);
        });
    }
  
    return (
        <div className="login">
            <h1>Signup</h1>
            <form>
                <label htmlFor="email">Email: </label>
                <input value={email} type="email" id="email" name="email" onChange={(e) => setEmail(e.target.value)} />
                <label htmlFor="password">Password: </label>
                <input value={password} type="password" id="password" name="password" onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" onClick={signUpUser}>Sign up</button>
            </form>
        </div>
    );
}

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    function loginUser(e) {
        e.preventDefault();
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {navigate("/")})
            .catch((error) => {
            console.log(error.code, error.message)
        });
    }
  
    return (
        <div className="login">
            <h1>Login</h1>
            <form>
                <label htmlFor="email">Email: </label>
                <input value={email} type="email" id="email" name="email" onChange={(e) => setEmail(e.target.value)} />
                <label htmlFor="password">Password: </label>
                <input value={password} type="password" id="password" name="password" onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" onClick={loginUser}>Log in</button>
            </form>
            <p>New user?<Link to="/signup">{"Sign up"}</Link></p>
        </div>
      
    );
}

function Home({ lists, books, logout, addList }) {
    const navigate = useNavigate();
    function handleSearch( event ) {
        event.preventDefault()
        navigate("/search/" + event.currentTarget.elements.searchTerm.value);
    }

    return (
        <div>
            <header>
                <img src={logo} />
                <div className='headerRight'>
                    <form onSubmit={handleSearch}>
                        <input type="text" id="searchTerm" placeholder="Search"/>
                        <input type="submit" value=" " className="search-icon" />
                    </form>
                    <img src={plus} onClick={addList}/>
                    <img src={profile} onClick={logout}/>
                </div>
            </header>
            {lists.map(list => <Shelf key={list.listId} listId={list.listId} name={list.name} description={list.description} bookIds={list.books.slice(0, 3)} books={books} />)}
        </div>
    );
}

function Shelf({ listId, name, description, bookIds, books }) {
    const navigate = useNavigate();
    function toList() {
        navigate("/list/" + listId);
    }
    console.log(bookIds)
    console.log(books)
    const booksOnList = bookIds.map(currentId => books.find(({ bookId }) => bookId == currentId)).filter(book => book !== undefined);

    return (
        <div className="list-preview" >
            <div className="preview-text">
                <h1 className="truncate" onClick={toList}>{name}</h1>
                <p className="detail">{description}</p>
            </div>
            <div className="preview-shelf">
                <div className="shelf-content">
                    {booksOnList.map(book => <Link to={"/book/" + book.bookId}><img className="shelf-cover" src={`https://covers.openlibrary.org/b/id/${book.cover}-M.jpg`} /></Link>)}
                    <img src={cherryArrow} onClick={toList}/>
                </div>
                <img src={shelfImg} className="shelf"/>
            </div>
        </div>
    )
}

function Search({ logout, addList }) {
    const navigate = useNavigate();
    function handleSearch( event ) {
        event.preventDefault()
        navigate("/search/" + event.currentTarget.elements.searchTerm.value);
    }

    const params = useParams();
    const [results, setResults] = useState([]);
    useEffect(() => {
        fetch('https://openlibrary.org/search.json?q=' + params.searchTerm)
          .then(response => response.json())
          .then(json => setResults(json.docs))
          .catch(error => console.error(error));
    }, [params.searchTerm]);

    return (
        <div>
            <header>
                <img src={logo} />
                <div className='headerRight'>
                    <form onSubmit={handleSearch}>
                        <input type="text" id="searchTerm" placeholder="Search"/>
                        <input type="submit" value=" " className="search-icon" />
                    </form>
                    <img src={plus} onClick={addList}/>
                    <img src={profile} onClick={logout}/>
                </div>
            </header>
            <h1><span className="light">Search results for</span> "{params.searchTerm}":</h1>
            <div className="book-list">
                {results.map(book => <SearchItem bookId={book.key.replace('/works/','')} title={book.title} author={book.author_name} cover={book.cover_i} />)}
            </div>
        </div>
    );
}

function SearchItem({ bookId, title, author, cover }) {
    const resultInfo = {
        bookId: bookId,
        title: title,
        author: author,
        cover: [cover],
        lists: []
    }

    return (
        <ListItem bookInfo={resultInfo} />
    )
}

function List({ lists, books, logout, addList, editList }) {
    const navigate = useNavigate();
    function handleSearch( event ) {
        event.preventDefault()
        navigate("/search/" + event.currentTarget.elements.searchTerm.value);
    }

    const params = useParams();
    const listInfo = lists.find(({ listId }) => listId == params.listId);
    const booksOnList = listInfo.books.map(currentId => books.find(({ bookId }) => bookId == currentId))
    
    function handleListEdit({ }) {
        const newName = prompt("Name?");
        const newDescription = prompt("Description?");
        const newList = {listId: listInfo.listId,
                         name: newName,
                         description: newDescription,
                         books: listInfo.books}
        editList( newList )
    }

    return (
        <div>
            <header>
                <img src={logo} />
                <div className='headerRight'>
                    <form onSubmit={handleSearch}>
                        <input type="text" id="searchTerm" placeholder="Search"/>
                        <input type="submit" value=" " className="search-icon" />
                    </form>
                    <img src={plus} onClick={addList}/>
                    <img src={profile} onClick={logout}/>
                </div>
            </header>
            <div className='list-header'>
                <h1>{listInfo.name}</h1>
                <img src={edit} onClick={handleListEdit} />
            </div>
            <p className='detail'>{listInfo.description}</p>
            <div className="book-list">
                {booksOnList.map(book => <ListItem bookInfo={book} />)}
            </div>
        </div>
    );
}

function ListItem({ bookInfo }) {
    const navigate = useNavigate();
    function toBook() {
        navigate("/book/" + bookInfo.bookId);
    }

    return (
        <div className="list-item" onClick={toBook}>
            <img src={`https://covers.openlibrary.org/b/id/${bookInfo.cover}-M.jpg`} className="list-cover" />
            <h2 className="list">{bookInfo.title}</h2>
            <p>{bookInfo.author}</p>
        </div>
    );
}

function Book({ lists, books, logout, addList, editList }) {
    const [bookInfo, setBookInfo] = useState(null);
    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        const foundBook = books.find(({ bookId }) => bookId === params.bookId);
        if (foundBook) {
            setBookInfo(foundBook);
        } else {
            fetch(`https://openlibrary.org/works/${params.bookId}.json`)
                .then(response => response.json())
                .then(data => {
                    const fetchedBookInfo = {
                        bookId: params.bookId,
                        title: data.title,
                        author: data.authors ? data.authors.map(author => author.name).join(', ') : 'Unknown',
                        cover: data.covers ? data.covers[0] : null,
                        lists: []
                    };
                    setBookInfo(fetchedBookInfo);
                })
                .catch(error => console.error('Error fetching book data:', error));
        }
    }, [params.bookId, books]);

    function handleSearch(event) {
        event.preventDefault();
        navigate("/search/" + event.currentTarget.elements.searchTerm.value);
    }

    async function handleCheck(listId, checked) {
        if (!bookInfo) return;

        // Update the lists the book is part of
        const updatedBookLists = checked
            ? [...bookInfo.lists, listId]
            : bookInfo.lists.filter(id => id !== listId);
    
        const listInfo = lists.find(({ listId }) => listId == listId);
        console.log(listInfo)
        const updatedBooksOnList = checked
                    ? [...listInfo.books, bookInfo.bookId]
                    : listInfo.books.filter(id => id !== bookInfo.bookId);
        const newListEntry = {userId: listInfo.userId,
                              listId: listInfo.listId,
                              name: listInfo.name,
                              description: listInfo.description,
                              books: updatedBooksOnList}
        editList(newListEntry)
    
        // Set the updated state
        setBookInfo({ ...bookInfo, lists: updatedBookLists });
    
        try {
            const bookDocRef = doc(db, "books", bookInfo.bookId);
            if (books.some(book => book.bookId === bookInfo.bookId)) {
                // If book exists, update it
                await updateDoc(bookDocRef, { lists: updatedBookLists });
            } else {
                // If book doesn't exist, add it
                const newBook = {
                    ...bookInfo,
                    lists: updatedBookLists,
                    userId: auth.currentUser.uid
                };
                await addDoc(collection(db, "books"), newBook);
            }
    
            /*// Update the list in Firestore
            const listDocRef = doc(db, "lists", listId);
            const updatedList = updatedLists.find(list => list.listId === listId);
            await updateDoc(listDocRef, { books: updatedList.books });*/
        } catch (error) {
            console.error("Error updating book or list: ", error);
        }
    }

    if (!bookInfo) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <header>
                <img src={logo} alt="logo" />
                <div className='headerRight'>
                    <form onSubmit={handleSearch}>
                        <input type="text" id="searchTerm" placeholder="Search" />
                        <input type="submit" value=" " className="search-icon" />
                    </form>
                    <img src={plus} alt="Add" onClick={addList} />
                    <img src={profile} alt="Profile" onClick={logout} />
                </div>
            </header>
            <div className="book-page">
                <div className="page-content">
                    <h1>{bookInfo.title}</h1>
                    <p className="detail">{bookInfo.author}</p>
                    <h2 className="book">My Lists</h2>
                    {lists.map(list => (
                        <CheckList 
                            key={list.listId} 
                            listName={list.name}
                            listId={list.listId}
                            onList={bookInfo.lists.includes(list.listId)} 
                            handleCheck={handleCheck} 
                        />
                    ))}
                </div>
                <img 
                    src={`https://covers.openlibrary.org/b/id/${bookInfo.cover}-L.jpg`} 
                    className="page-cover" 
                    alt={bookInfo.title} 
                />
            </div>
        </div>
    );
}

function CheckList({ listName, listId, onList, handleCheck }) {
    return (
        <label className="container">{listName}
            <input type="checkbox" checked={onList} onChange={(e) => handleCheck(listId, e.target.checked)} />
            <span className="checkmark"></span>
        </label>
    );
}

function MainApp() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [lists, setLists] = useState([]);
    const [books, setBooks] = useState([]);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setUser(user);
            dbGetBooks(user.uid);
        } else {
            setUser(null);
            navigate("/login");
        }
        })
        return () => unsubscribe();
    }, [navigate]);

    async function dbGetBooks(uid) {
        try {
            const q1 = query(collection(db, "lists"), where("userId", "==", uid));
            const querySnapshot1 = await getDocs(q1);
            const fetchedLists = querySnapshot1.docs.map((list) => ({...list.data() }));
            setLists(fetchedLists);
            const q2 = query(collection(db, "books"), where("userId", "==", uid));
            const querySnapshot2 = await getDocs(q2);
            const fetchedBooks = querySnapshot2.docs.map((book) => ({...book.data() }));
            setBooks(fetchedBooks);
        } catch (e) {
            console.error("Error fetching data: ", e);
        }
    }

    function logout() {
        signOut(auth).then(() => { }).catch((error) => {console.error("Error", error);});
    }
    useEffect(() => {
        if (user === null) {
            navigate("/login")
        }
    }, [user, navigate])
    
    async function addList() {
        if (user) {
            const newList = {userId: user.uid,
                             name: 'Untitled',
                             description: '',
                             books: []};

            try {
                const docRef = await addDoc(collection(db, "lists"), newList);
                setLists(lists.concat({ ...newList, listId: docRef.id }));
            } catch (e) {
                console.error("Error adding note: ", e);
            }
          }
    }

    async function editList({ newList }) {
        if (user) {
            try {
                const listLoc = doc(db, "lists", newList.listId);
                await updateDoc(listLoc, newList);
                dbGetBooks()
            } catch (e) {
                console.error("Error editing note: ", e);
            }
        }
    }

    return (
        <Routes>
            <Route path="/" element={<Home lists={lists} books={books} logout={logout} addList={addList} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/search/:searchTerm" element={<Search logout={logout} addList={addList} />} />
            <Route path="/list/:listId" element={<List lists={lists} books={books} logout={logout} addList={addList} editList={editList}/>} />
            <Route path="/book/:bookId" element={<Book lists={lists} books={books} logout={logout} addList={addList} editList={editList} />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <MainApp />
        </Router>
    )
}

export default App;
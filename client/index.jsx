import React, { useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

// functions

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed ${res.status}`);
  }
  return await res.json();
}

/*function useLoader(loadingFn) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState();
  const [error, setError] = useState();

  async function load() {
    try {
      setLoading(true);
      setData(await loadingFn());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => load(), []);
  return { loading, data, error };
}*/

// initialize a context for Profile, setting it to an object.
const ProfileContext = React.createContext({
  userinfo: undefined,
});

// components
function FrontPage({reload}) {
  const {userinfo} = useContext(ProfileContext);

  async function handleLogout() {
    await fetch("/api/login", { method: "delete" });
    reload();
  }

  return (
    <div>
      <h1>Front Page</h1>
      {!userinfo && (
          <div>
            <Link to={"/login"}>Log in</Link>
          </div>
      )}

      {userinfo && (
          <div>
            <Link to={"/profile"}>Profile for {userinfo.name}</Link>
          </div>
      )}
      {userinfo && (
          <div>
            <button onClick={handleLogout}>Log out</button>
          </div>
      )}
    </div>
  );
}
// ber deg logge på google. Sender deg til loginCallback
function Login() {
  const { oauth_config } = useContext(ProfileContext);
  useEffect(async () => {
    const { discovery_url, client_id, scope } = oauth_config;
    const discoveryDocument = await fetchJSON(discovery_url);
    const { authorization_endpoint } = discoveryDocument;
    const parameters = {
      response_type: "token",
      response_mode: "fragment",
      scope,
      client_id,
      redirect_uri: window.location.origin + "/login/callback",
    };
    window.location.href =
      authorization_endpoint + "?" + new URLSearchParams(parameters);
  }, []);
  return (
    <div>
      <div>Please Wait....</div>
    </div>
  );
}

// Sender data til server. Der lages cookie. Bruker sendes tilbake til frontPage
function LoginCallback({reload}) {
  const navigate = useNavigate();
  useEffect(async () => {
    const { access_token } = Object.fromEntries(
      new URLSearchParams(window.location.hash.substring(1))
    );
   const res = await fetch("/api/login", {
      method: "POST",
      body: new URLSearchParams({ access_token }),
    });
    if (res.ok) {
      reload();
      navigate("/");
    }
  }, []);
  return <h1>Please wait...</h1>;
}

// her kommer all info knyttet til bruker. antageligvis db ting.
function Profile() {
  const { userinfo } = useContext(ProfileContext);
  console.log(userinfo)
  return (
    <div>
      <h1>
        User profile: {userinfo.name} ({userinfo.email})
      </h1>
      {userinfo.picture && (
        <img src={userinfo.picture} alt={userinfo.name + " profile picture"} />
      )}
    </div>
  );
}

function Application() {
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState();
  useEffect(loadLoginInfo, []);

  // data om bruker
  async function loadLoginInfo() {
    setLoading(true);
    setLogin(await fetchJSON("/api/login"));
    setLoading(false);
  };

  useEffect(() => {
    console.log({ login });
  }, [login]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ProfileContext.Provider value={login}>
      <BrowserRouter>
        <Routes>
          <Route path={"/"} element={<FrontPage reload={loadLoginInfo} />} />
          <Route path={"/login"} element={<Login />} />
          <Route path={"/login/callback"} element={<LoginCallback reload={loadLoginInfo} />} />
          <Route path={"/profile"} element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </ProfileContext.Provider>
  );
}

ReactDOM.render(<Application />, document.getElementById("app"));

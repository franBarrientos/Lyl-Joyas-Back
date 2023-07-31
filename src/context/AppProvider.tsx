import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

import { CategoryInterface } from "../interfaces/category";
import { ProductInterface } from "../interfaces/product";
import { UserDto } from "../interfaces/user";
import { useToast } from "@chakra-ui/react";
import { getAllCategories } from "../api/category.api";
import { createOrderMp, createPurchase } from "../api/purchase.api";
import { createPurchasesProducts } from "../api/purchaseProduct";
import { Navigate } from "react-router-dom";
import apiClient from "../config/axiosClient";
import { modalesRX, updateCategoriesRX } from "../helpers/subjectsRx.helper";

interface MyContextType {
  categories: CategoryInterface[] | null;
  actualCategory: CategoryInterface;
  handleClickCategory: (id: number) => void;
  carrito: ProductInterface[] | null;
  handleAddToCarrito: (product: ProductInterface) => void;
  pay: (payment: string, customerId: number) => void;
  handleEditProductOfCarrito: (id: number, newQuantity: number) => void;
  handleRemoveProductFromCarrito: (id: number) => void;
  user: UserDto | null;
  setUser: Dispatch<SetStateAction<UserDto | null>>;
  featureAdmin: CategoryInterface | undefined;
  handleClickCategoryAdmin: (id: number) => void;
  categoriesAdmin: CategoryInterface[];
  totalCarrito: () => number;
}

export const AppContext = createContext<MyContextType>({} as MyContextType);

type AppContextProviderProps = {
  children: ReactNode;
};

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
}) => {
  const categoriesAdmin: CategoryInterface[] = [
    {
      id: 2,
      img: "https://res.cloudinary.com/dkkd5eszg/image/upload/w_1000,ar_1:1,c_fill,g_auto,f_webp/v1689558498/AYG0062BIG1_lmmx2d.jpg",
      name: "Productos",
    },
    {
      id: 3,
      img: "https://res.cloudinary.com/dkkd5eszg/image/upload/w_1000,ar_1:1,c_fill,g_auto,f_webp/v1690830833/CategoriaOk_vb1a82.jpg",
      name: "Categorias",
    },
    {
      id: 4,
      img: "https://res.cloudinary.com/dacgvqpeg/image/upload/w_1000,ar_1:1,c_fill,g_auto,f_webp/v1688648341/images_vs2byy.png",
      name: "Ventas",
    },
    {
      id: 1,
      img: "https://res.cloudinary.com/dacgvqpeg/image/upload/w_1000,ar_1:1,c_fill,g_auto,f_webp/v1688648111/3309960_synkq9.png",
      name: "Estadisticas",
    },
  ];
  const [categories, setCategories] = useState<CategoryInterface[] | null>([]);
  const [carrito, setCarrito] = useState<ProductInterface[] | []>([]);
  const [actualCategory, setActualCategory] = useState<CategoryInterface>({
    id: 1,
    img: "",
    name: "",
  });
  const [user, setUser] = useState<UserDto | null>(null);
  const [featureAdmin, setFeatureAdmin] = useState<CategoryInterface>(
    categoriesAdmin[0]
  );
  const toast = useToast();
  const subscribe = updateCategoriesRX.getSubject;
  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      if (!response.data.ok) throw new Error("Error fetch categories");
      setCategories(response.data.body);
      setActualCategory(response.data.body[0]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    subscribe.subscribe((data) => {
      if (data) {
        fetchCategories();
      }
    });
  }, []);

  useEffect(() => {
    const userStringify = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!userStringify) return;
    if (!token) return;
    const user: UserDto | null = JSON.parse(userStringify);
    setUser(user);
    if (user && user.role == "ADMIN") {
      <Navigate to={"/admin"} />;
    } else {
      <Navigate to={"/"} />;
    }
  }, []);

  useEffect(() => {
    const refreshToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await apiClient.post("/refreshToken", {
            token,
          });
          if (!response.data.ok) throw new Error("Expired");
          console.log(response);
          localStorage.setItem("token", response.data.body.token);
        } catch (error) {
          toast({
            title: `Sesion expirada por favor inicie sesion de nuevo`,
            status: "warning",
            duration: 1500,
            position: "top-left",
            isClosable: true,
          });
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
    };
    refreshToken();
  }, []);

  const handleClickCategory = (id: number) => {
    const category = categories?.filter((category) => category.id == id)[0];
    setActualCategory(category!);
  };

  const handleAddToCarrito = (product: ProductInterface) => {
    if (carrito.some((carritoState) => carritoState.id == product.id)) {
      const carritoActualizado = carrito.map((carritoState) =>
        carritoState.id == product.id ? product : carritoState
      );
      setCarrito(carritoActualizado);
      toast({
        title: `Cantidad Editada Correctamente`,
        status: "success",
        duration: 1500,
        position: "top-left",
        isClosable: true,
      });
    } else {
      setCarrito([...carrito, product]);
      toast({
        title: `${product.name} Añadido al Carrito`,
        status: "success",
        duration: 1500,
        position: "top-left",
        isClosable: true,
      });
    }
  };

  const totalCarrito = () => {
    if (carrito) {
      let total = 0;
      carrito.forEach(
        (product) => (total += product.price * (product.quantity || 1))
      );
      return total;
    } else {
      return 0;
    }
  };

  const handleEditProductOfCarrito = (id: number, newQuantity: number) => {
    const product = carrito.find((product) => product.id == id);
    if (product) product.quantity = newQuantity;
  };

  const handleRemoveProductFromCarrito = (id: number) => {
    setCarrito(carrito.filter((product) => product.id != id));
    toast({
      title: `Quitado del Carrito`,
      status: "warning",
      duration: 1500,
      position: "top-left",
      isClosable: true,
    });
  };

  const payMercadoPago = async (idPurchase: number) => {
    const response = await createOrderMp(carrito, idPurchase);
    window.location.replace(response.data.body.urlMercadoPago);
  };
  const goToWpp = (nroPurchase:number) => {
    const userLocalStorage = JSON.parse(localStorage.getItem("user")!)
    const address = userLocalStorage.customer.addres? userLocalStorage.customer.addres : " "
    const numeroWhatsApp = import.meta.env.VITE_WPP;
    const mensaje: string = `
      ¡Hola Cami 😊!
      Confirmo la compra *${nroPurchase}*
      Este fue mi pedido...
      ${[null,...carrito].map((product) => {
        if (product === null) return '\n';
        return ` ✅${product.name} Cantidad:${product.quantity}\n`;
      }).join('')}
      El total del pedido fue de $${totalCarrito()}    
      Mi dirección es - ${address}
      Espero el precio del envio...
    `;
    const enlaceWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(
      mensaje
    )}&type=phone_number`;
    window.open(enlaceWhatsApp, "_blank");
  };
  const pay = async (payment: string, customerId: number) => {
    modalesRX.setSubject(["mercadopago-spinner", true]);
    try {
      const response = await createPurchase({
        state: "pendiente",
        payment,
        customer: customerId,
      });
      if (!response.data.ok) throw new Error("err");
      if (payment == "MP") payMercadoPago(response.data.body.id);
      if (payment == "CASH") goToWpp(response.data.body.id);
      Promise.all(
        carrito.map((product) => {
          return createPurchasesProducts({
            quantity: product.quantity!,
            purchase: response.data.body.id,
            product: product.id,
          });
        })
      )
        .then(() => {
          setCarrito([]);
          toast({
            title: "Compra Exitosa",
            description: "Disfruta tu compra",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
          modalesRX.setSubject(["carrito", false]);
          modalesRX.setSubject(["mercadopago-spinner", false]);
          return;
        })
        .catch(() => {
          throw new Error("err");
        });
    } catch (error) {
      modalesRX.setSubject(["mercadopago-spinner", false]);
      toast({
        title: "Error de server",
        status: "error",
        duration: 1500,
        isClosable: true,
      });
      return;
    }
  };

  const handleClickCategoryAdmin = (id: number) => {
    const category = categoriesAdmin?.filter(
      (category) => category.id == id
    )[0];
    setFeatureAdmin(category);
  };

  const contextValue: MyContextType = {
    categories,
    actualCategory,
    handleClickCategory,
    carrito,
    handleAddToCarrito,
    pay,
    setUser,
    user,
    handleEditProductOfCarrito,
    handleRemoveProductFromCarrito,
    featureAdmin,
    categoriesAdmin,
    handleClickCategoryAdmin,
    totalCarrito,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export default AppContext;

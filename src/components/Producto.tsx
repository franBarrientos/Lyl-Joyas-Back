import {
  Card,
  CardBody,
  Image,
  Stack,
  Heading,
  Text,
  Divider,
  CardFooter,
  Button,
  NumberInput,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputStepper,
  NumberInputField,
  Flex,
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  useDisclosure,
  useToast,
  CircularProgress,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
} from "@chakra-ui/react";
import { ProductInterface } from "../interfaces/product";
import useApp from "../hook/useApp";
import { useState, useRef } from "react";
import apiClient from "../config/axiosClient";
import { releaseImgUrl } from "../helpers/cloudinaty.helper";

type productoProp = {
  producto: ProductInterface;
  key: number;
  isAdmin: boolean;
};

export default function Producto({ producto, isAdmin = false }: productoProp) {
  const { handleAddToCarrito, categories } = useApp();
  const [quantity, setQuantity] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpen1,
    onOpen: onOpen1,
    onClose: onClose1,
  } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const [editProduct, setEditProduct] = useState<ProductInterface>(producto);

  const handleChangeProduct = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditProduct({ ...editProduct, [e.target.name]: e.target.value });
  };

  function getDifferentFields(object1: any, object2: any) {
    const result = Object.entries(object1).reduce((acc, [key, value]) => {
      if (object2[key] !== value) {
        return { ...acc, [key]: value };
      }
      return acc;
    }, {});

    return result;
  }

  const onSubmitEditProduct = async () => {
    setIsLoading(true);
    const formData: {name?:string, description?:string, price?: string | number; category?: string | number, } = getDifferentFields(
      editProduct,
      producto
    );
    if(formData.description === "" || formData.price === "" || formData.name === "" || formData.category === ""){
      setIsLoading(false);
      toast({
        title: "Faltan Campos Porfavor completalos",
        status: "error",
        duration: 2000,
        position: "top-left",
        isClosable: true,
      });
      return
    }
    if (formData.price) formData.price = Number(formData.price);
    if (formData.category) formData.category = Number(formData.category);
    try {
      const response = await apiClient.put(
        `/product/${producto.id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.data.ok) throw new Error("err");
      toast({
        title: "Changes Saved Successfuly",
        status: "success",
        duration: 2000,
        position: "top-left",
        isClosable: true,
      });
      onClose1();
      setIsLoading(false);
      return;
    } catch (error) {
      toast({
        title: "Invalid Values .",
        description: "Ingrese a price valid.",
        status: "error",
        duration: 2000,
        position: "top-left",
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }
  };

  return (
    <Card
      maxW="sm"
      boxShadow="2px 6px 10px rgba(254, 189, 87, 0.5)" // Sombra con color rojo
      bg={"ly.900"}
    >
      <CardBody color={"ly.400"}>
        <Image
          src={releaseImgUrl(producto.img)}
          w={400}
          h={300}
          borderRadius="lg"
        />
        <Stack mt="6" spacing="3">
          <Heading size="md">{producto.name}</Heading>
          <Text>{producto.description}</Text>
          <Text color="ly.700" fontSize="2xl">
            ${producto.price}
          </Text>
        </Stack>
      </CardBody>
      <Divider />
      <CardFooter>
        {isAdmin ? (
          <Flex
            justifyContent={"center"}
            alignItems={"center"}
            gap={2}
            direction={{ base: "row" }}
          >
            <Button
              onClick={() => onOpen1()}
              variant="solid"
              colorScheme="blue"
              shadow={"xl"}
            >
              Editar
            </Button>
            <Button
              onClick={() => onOpen()}
              variant="solid"
              colorScheme="red"
              shadow={"xl"}
            >
              Eliminar
            </Button>
          </Flex>
        ) : (
          <Flex
            justifyContent={"space-evenly"}
            alignItems={"center"}
            w={"full"}
            direction={{ base: "row", md: "column", xl: "row" }}
          >
            <NumberInput
              size="lg"
              color={"ly.400"}
              bg={"ly.800"}
              maxW={20}
              min={1}
              value={quantity}
              onChange={(_, value) => setQuantity(value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper color={"ly.400"} />
                <NumberDecrementStepper color={"ly.400"} />
              </NumberInputStepper>
            </NumberInput>
            <Button
              onClick={() => handleAddToCarrito({ ...producto, quantity })}
              variant="ghost"
              color={"ly.900"}
              bg={"ly.700"}
            >
              Añadir al Carrito
            </Button>
          </Flex>
        )}
      </CardFooter>
      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
      >
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader>Presiona si para confirmar?</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>Estas seguro que deseas eliminar?</AlertDialogBody>
          <AlertDialogFooter>
            <Button onClick={onClose}>No</Button>
            {isLoading ? (
              <Flex justifyContent={"center"} alignItems={"center"}>
                <CircularProgress isIndeterminate color="green.300" />
              </Flex>
            ) : (
              <Button
                onClick={async () => {
                  try {
                    const response = await apiClient.put(
                      `/product/${producto.id}`,
                      {
                        stock: false,
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                      }
                    );
                    if (!response.data.ok) throw new Error("err");
                    setIsLoading(false);
                    toast({
                      title: "Producto eliminado correctamente",
                      status: "error",
                      duration: 2000,
                      position: "top-left",
                      isClosable: true,
                    });
                    onClose();
                    return;
                  } catch (error) {
                    setIsLoading(false);
                    toast({
                      title: "Error on Server",
                      status: "error",
                      duration: 2000,
                      position: "top-left",
                      isClosable: true,
                    });
                  }
                }}
                colorScheme="red"
                ml={3}
              >
                Si
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Modal isOpen={isOpen1} onClose={onClose1}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form>
              <Heading mb={4}>Editar Producto</Heading>
              <FormControl>
                <FormLabel>Nombre</FormLabel>
                <Input
                  type="text"
                  name="name"
                  onChange={handleChangeProduct}
                  value={editProduct.name}
                  placeholder="Your product name"
                  focusBorderColor="gray.600"
                  borderColor={"whiteAlpha.300"}
                  shadow={"xl"}
                  _placeholder={{ color: "gray.400" }}
                />
              </FormControl>
              <FormControl mt={4}>
                <FormLabel>Descripcion</FormLabel>
                <Input
                  type="text"
                  name="description"
                  onChange={handleChangeProduct}
                  value={editProduct.description}
                  placeholder="Your description"
                  focusBorderColor="gray.600"
                  borderColor={"whiteAlpha.300"}
                  shadow={"xl"}
                  _placeholder={{ color: "gray.400" }}
                />
              </FormControl>
              <FormControl mt={4}>
                <FormLabel>Imagen</FormLabel>
                <Input
                  type="text"
                  name="img"
                  onChange={handleChangeProduct}
                  value={editProduct.img}
                  placeholder="Your image"
                  focusBorderColor="gray.600"
                  borderColor={"whiteAlpha.300"}
                  shadow={"xl"}
                  _placeholder={{ color: "gray.400" }}
                />
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Categoria</FormLabel>

                <Select
                  defaultValue={editProduct.category.id || 1}
                  placeholder="Select category"
                  name="category"
                  onChange={handleChangeProduct}
                >
                  {categories?.map((category) => (
                    <option value={category.id}>{category.name}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Precio</FormLabel>
                <Input
                  onChange={handleChangeProduct}
                  value={editProduct.price}
                  type="number"
                  name="price"
                  placeholder="Your price"
                  focusBorderColor="gray.600"
                  borderColor={"whiteAlpha.300"}
                  shadow={"xl"}
                  _placeholder={{ color: "gray.400" }}
                />
              </FormControl>
            </form>
          </ModalBody>

          <ModalFooter display={"flex"} justifyContent={"space-between"}>
            {isLoading ? (
              <Flex justifyContent={"center"} alignItems={"center"}>
                <CircularProgress isIndeterminate color="green.300" />
              </Flex>
            ) : (
              <Button
                onClick={() => onSubmitEditProduct()}
                type="submit"
                colorScheme="blue"
                width={"full"}
              >
                Guardar Cambios
              </Button>
            )}
            <Button colorScheme="red" ml={1} onClick={onClose1}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
